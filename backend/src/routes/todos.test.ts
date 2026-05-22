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
      findFirst: vi.fn(
        async ({
          where,
        }: {
          where: {
            id: string;
            sessionId: string;
          };
        }) => {
          const matchedTodo = store.find(
            (todo) => todo.id === where.id && todo.sessionId === where.sessionId,
          );
          return matchedTodo ? copyTodo(matchedTodo) : null;
        },
      ),
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
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: {
            id: string;
          };
          data: {
            completed: boolean;
          };
        }) => {
          const matchedTodo = store.find((todo) => todo.id === where.id);
          if (!matchedTodo) {
            throw new Error('Todo not found');
          }

          matchedTodo.completed = data.completed;
          matchedTodo.updatedAt = new Date();
          return copyTodo(matchedTodo);
        },
      ),
      delete: vi.fn(
        async ({
          where,
        }: {
          where: {
            id: string;
          };
        }) => {
          const matchedTodoIndex = store.findIndex((todo) => todo.id === where.id);
          if (matchedTodoIndex === -1) {
            throw new Error('Todo not found');
          }

          const [deletedTodo] = store.splice(matchedTodoIndex, 1);
          return copyTodo(deletedTodo);
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

  it('toggles todo completion and returns updated todo envelope', async () => {
    await prismaMock.todo.createMany({
      data: [
        { sessionId: SESSION_A, text: 'todo to toggle', completed: false, sortOrder: 2 },
        { sessionId: SESSION_A, text: 'neighbor todo', completed: false, sortOrder: 8 },
      ],
    });

    const initialResponse = await request(app)
      .get('/api/todos')
      .set('Cookie', cookieFor(SESSION_A));
    const targetTodo = initialResponse.body.todos.find(
      (todo: { text: string }) => todo.text === 'todo to toggle',
    );

    const response = await request(app)
      .patch(`/api/todos/${targetTodo.id}`)
      .set('Cookie', cookieFor(SESSION_A))
      .send({ completed: true });

    expect(response.status).toBe(200);
    expect(response.body.todo).toMatchObject({
      id: targetTodo.id,
      completed: true,
      sortOrder: 2,
    });

    const afterToggleResponse = await request(app)
      .get('/api/todos')
      .set('Cookie', cookieFor(SESSION_A));
    expect(afterToggleResponse.body.todos.map((todo: { id: string }) => todo.id)).toEqual(
      initialResponse.body.todos.map((todo: { id: string }) => todo.id),
    );
  });

  it('returns NOT_FOUND when patching a todo from another session', async () => {
    await prismaMock.todo.createMany({
      data: [{ sessionId: SESSION_B, text: 'foreign todo', completed: false, sortOrder: 0 }],
    });

    const sessionBResponse = await request(app)
      .get('/api/todos')
      .set('Cookie', cookieFor(SESSION_B));
    const foreignTodoId = sessionBResponse.body.todos[0].id;

    const response = await request(app)
      .patch(`/api/todos/${foreignTodoId}`)
      .set('Cookie', cookieFor(SESSION_A))
      .send({ completed: true });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Todo not found',
      },
    });
  });

  it('returns validation error when completed is not a boolean', async () => {
    await prismaMock.todo.createMany({
      data: [{ sessionId: SESSION_A, text: 'todo to toggle', completed: false, sortOrder: 0 }],
    });

    const sessionAResponse = await request(app)
      .get('/api/todos')
      .set('Cookie', cookieFor(SESSION_A));
    const todoId = sessionAResponse.body.todos[0].id;

    const response = await request(app)
      .patch(`/api/todos/${todoId}`)
      .set('Cookie', cookieFor(SESSION_A))
      .send({ completed: 'yes' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(typeof response.body.error.message).toBe('string');
  });

  it('deletes a todo and returns success envelope', async () => {
    await prismaMock.todo.createMany({
      data: [
        { sessionId: SESSION_A, text: 'todo to delete', completed: false, sortOrder: 0 },
        { sessionId: SESSION_A, text: 'todo to keep', completed: false, sortOrder: 1 },
      ],
    });

    const initialResponse = await request(app)
      .get('/api/todos')
      .set('Cookie', cookieFor(SESSION_A));
    const todoToDelete = initialResponse.body.todos.find(
      (todo: { text: string }) => todo.text === 'todo to delete',
    );

    const response = await request(app)
      .delete(`/api/todos/${todoToDelete.id}`)
      .set('Cookie', cookieFor(SESSION_A));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });

    const afterDeleteResponse = await request(app)
      .get('/api/todos')
      .set('Cookie', cookieFor(SESSION_A));
    expect(afterDeleteResponse.body.todos).toHaveLength(1);
    expect(afterDeleteResponse.body.todos[0].text).toBe('todo to keep');
  });

  it('returns NOT_FOUND when deleting a todo from another session', async () => {
    await prismaMock.todo.createMany({
      data: [{ sessionId: SESSION_B, text: 'foreign todo', completed: false, sortOrder: 0 }],
    });

    const sessionBResponse = await request(app)
      .get('/api/todos')
      .set('Cookie', cookieFor(SESSION_B));
    const foreignTodoId = sessionBResponse.body.todos[0].id;

    const response = await request(app)
      .delete(`/api/todos/${foreignTodoId}`)
      .set('Cookie', cookieFor(SESSION_A));

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Todo not found',
      },
    });
  });

  it('keeps sibling todos intact after deleting one item', async () => {
    await prismaMock.todo.createMany({
      data: [
        { sessionId: SESSION_A, text: 'first sibling', completed: false, sortOrder: 0 },
        { sessionId: SESSION_A, text: 'target sibling', completed: false, sortOrder: 1 },
        { sessionId: SESSION_A, text: 'third sibling', completed: false, sortOrder: 2 },
      ],
    });

    const initialResponse = await request(app)
      .get('/api/todos')
      .set('Cookie', cookieFor(SESSION_A));
    const targetTodo = initialResponse.body.todos.find(
      (todo: { text: string }) => todo.text === 'target sibling',
    );

    await request(app)
      .delete(`/api/todos/${targetTodo.id}`)
      .set('Cookie', cookieFor(SESSION_A));

    const afterDeleteResponse = await request(app)
      .get('/api/todos')
      .set('Cookie', cookieFor(SESSION_A));
    expect(afterDeleteResponse.body.todos.map((todo: { text: string }) => todo.text)).toEqual([
      'first sibling',
      'third sibling',
    ]);
  });
});
