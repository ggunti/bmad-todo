import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const SESSION_A = 'test-session-a';
const SESSION_B = 'test-session-b';

const cookieFor = (sessionId: string) => `sessionId=${sessionId}`;

type TodoRecord = {
  id: string;
  sessionId: string;
  text: string;
  completed: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

const { prismaMock, todoStore, resetTodoStore } = vi.hoisted(() => {
  const store: TodoRecord[] = [];
  let sequence = 0;

  const copyTodo = (todo: TodoRecord) => ({ ...todo });

  const mock = {
    todo: {
      deleteMany: vi.fn(async ({ where }: { where: { sessionId: { in: string[] } } }) => {
        const sessionIds = new Set(where.sessionId.in);
        const originalLength = store.length;

        for (let index = store.length - 1; index >= 0; index -= 1) {
          if (sessionIds.has(store[index].sessionId)) {
            store.splice(index, 1);
          }
        }

        return { count: originalLength - store.length };
      }),
      createMany: vi.fn(
        async ({
          data,
        }: {
          data: Array<Pick<TodoRecord, 'sessionId' | 'text' | 'completed' | 'sortOrder'>>;
        }) => {
          const now = new Date();

          for (const entry of data) {
            sequence += 1;
            store.push({
              id: `todo-${sequence}`,
              createdAt: now,
              updatedAt: now,
              ...entry,
            });
          }

          return { count: data.length };
        },
      ),
      findMany: vi.fn(async ({ where }: { where: { sessionId: string } }) => {
        return store
          .filter((todo) => todo.sessionId === where.sessionId)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(copyTodo);
      }),
      aggregate: vi.fn(async ({ where }: { where: { sessionId: string } }) => {
        const matchingTodos = store.filter((todo) => todo.sessionId === where.sessionId);
        const sortOrderValues = matchingTodos.map((todo) => todo.sortOrder);

        return {
          _min: {
            sortOrder: sortOrderValues.length === 0 ? null : Math.min(...sortOrderValues),
          },
        };
      }),
      create: vi.fn(
        async ({
          data,
        }: {
          data: Pick<TodoRecord, 'sessionId' | 'text' | 'completed' | 'sortOrder'>;
        }) => {
          sequence += 1;
          const now = new Date();
          const createdTodo: TodoRecord = {
            id: `todo-${sequence}`,
            createdAt: now,
            updatedAt: now,
            ...data,
          };

          store.push(createdTodo);

          return copyTodo(createdTodo);
        },
      ),
    },
    $disconnect: vi.fn(async () => undefined),
  };

  return {
    prismaMock: mock,
    todoStore: store,
    resetTodoStore: () => {
      store.length = 0;
      sequence = 0;
    },
  };
});

vi.mock('../prisma/client.js', () => ({
  prisma: prismaMock,
}));

import { app } from '../app.js';

describe('todo routes', () => {
  beforeEach(async () => {
    resetTodoStore();
    vi.clearAllMocks();

    await prismaMock.todo.deleteMany({
      where: { sessionId: { in: [SESSION_A, SESSION_B] } },
    });
  });

  it('returns todos sorted by sortOrder in response envelope', async () => {
    await prismaMock.todo.createMany({
      data: [
        { sessionId: SESSION_A, text: 'session-a-two', completed: false, sortOrder: 2 },
        { sessionId: SESSION_A, text: 'session-a-zero', completed: false, sortOrder: 0 },
        { sessionId: SESSION_A, text: 'session-a-one', completed: false, sortOrder: 1 },
        { sessionId: SESSION_B, text: 'session-b-zero', completed: false, sortOrder: 0 },
      ],
    });

    const response = await request(app)
      .get('/api/todos')
      .set('Cookie', cookieFor(SESSION_A));

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.todos)).toBe(true);
    expect(response.body.todos).toHaveLength(3);
    expect(response.body.todos.map((todo: { sortOrder: number }) => todo.sortOrder)).toEqual([0, 1, 2]);
    expect(response.body.todos.every((todo: { sessionId: string }) => todo.sessionId === SESSION_A)).toBe(true);
  });

  it('creates a new todo at the top with envelope response', async () => {
    await prismaMock.todo.createMany({
      data: [
        { sessionId: SESSION_A, text: 'older-top', completed: false, sortOrder: 0 },
        { sessionId: SESSION_A, text: 'older-bottom', completed: false, sortOrder: 1 },
      ],
    });

    const response = await request(app)
      .post('/api/todos')
      .set('Cookie', cookieFor(SESSION_A))
      .send({ text: 'buy bread' });

    expect(response.status).toBe(201);
    expect(response.body.todo).toMatchObject({
      text: 'buy bread',
      completed: false,
      sortOrder: -1,
    });
  });

  it('returns validation errors for empty and over-length text', async () => {
    const emptyResponse = await request(app)
      .post('/api/todos')
      .set('Cookie', cookieFor(SESSION_A))
      .send({ text: '   ' });

    expect(emptyResponse.status).toBe(400);
    expect(emptyResponse.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Todo text cannot be empty',
      },
    });

    const overLengthResponse = await request(app)
      .post('/api/todos')
      .set('Cookie', cookieFor(SESSION_A))
      .send({ text: 'a'.repeat(1025) });

    expect(overLengthResponse.status).toBe(400);
    expect(overLengthResponse.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Todo text cannot exceed 1024 characters',
      },
    });
  });

  it('isolates session data between different cookies', async () => {
    await request(app)
      .post('/api/todos')
      .set('Cookie', cookieFor(SESSION_A))
      .send({ text: 'session-a-item' });

    await request(app)
      .post('/api/todos')
      .set('Cookie', cookieFor(SESSION_B))
      .send({ text: 'session-b-item' });

    const sessionAResponse = await request(app)
      .get('/api/todos')
      .set('Cookie', cookieFor(SESSION_A));
    const sessionBResponse = await request(app)
      .get('/api/todos')
      .set('Cookie', cookieFor(SESSION_B));

    expect(sessionAResponse.status).toBe(200);
    expect(sessionBResponse.status).toBe(200);
    expect(sessionAResponse.body.todos).toHaveLength(1);
    expect(sessionBResponse.body.todos).toHaveLength(1);
    expect(sessionAResponse.body.todos[0].text).toBe('session-a-item');
    expect(sessionBResponse.body.todos[0].text).toBe('session-b-item');
  });
});
