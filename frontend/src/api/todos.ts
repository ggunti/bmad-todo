import type {
  ApiErrorResponse,
  CreateTodoRequest,
  CreateTodoResponse,
  Todo,
  ToggleTodoRequest,
  ToggleTodoResponse,
  TodosResponse,
} from '../types/todo';

export class TodosApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = 'TodosApiError';
    this.code = code;
    this.status = status;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isTodo = (value: unknown): value is Todo => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.text === 'string' &&
    typeof value.completed === 'boolean' &&
    typeof value.sortOrder === 'number' &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
};

const isTodosResponse = (value: unknown): value is TodosResponse => {
  if (!isRecord(value) || !Array.isArray(value.todos)) {
    return false;
  }

  return value.todos.every((todo) => isTodo(todo));
};

const isCreateTodoResponse = (value: unknown): value is CreateTodoResponse => {
  if (!isRecord(value) || !('todo' in value)) {
    return false;
  }

  return isTodo(value.todo);
};

const isToggleTodoResponse = (value: unknown): value is ToggleTodoResponse => {
  if (!isRecord(value) || !('todo' in value)) {
    return false;
  }

  return isTodo(value.todo);
};

const isApiErrorResponse = (value: unknown): value is ApiErrorResponse => {
  if (!isRecord(value) || !isRecord(value.error)) {
    return false;
  }

  return (
    typeof value.error.code === 'string' && typeof value.error.message === 'string'
  );
};

const readJsonObject = async (response: Response): Promise<Record<string, unknown>> => {
  const payload = await response.json();

  if (!isRecord(payload)) {
    throw new Error('Invalid API response format: expected a JSON object.');
  }

  return payload;
};

export const getTodos = async (): Promise<TodosResponse> => {
  const response = await fetch('/api/todos', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const payload = await readJsonObject(response);

  if (!response.ok) {
    if (!isApiErrorResponse(payload)) {
      throw new Error('Invalid API error payload shape.');
    }

    throw new TodosApiError(payload.error.code, payload.error.message, response.status);
  }

  if (!isTodosResponse(payload)) {
    throw new Error('Invalid todos payload shape.');
  }

  return payload;
};

export const createTodo = async (input: CreateTodoRequest): Promise<CreateTodoResponse> => {
  const response = await fetch('/api/todos', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const payload = await readJsonObject(response);

  if (!response.ok) {
    if (!isApiErrorResponse(payload)) {
      throw new Error('Invalid API error payload shape.');
    }

    throw new TodosApiError(payload.error.code, payload.error.message, response.status);
  }

  if (!isCreateTodoResponse(payload)) {
    throw new Error('Invalid create todo payload shape.');
  }

  return payload;
};

export const toggleTodoCompletion = async (
  id: string,
  input: ToggleTodoRequest,
): Promise<ToggleTodoResponse> => {
  const response = await fetch(`/api/todos/${id}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const payload = await readJsonObject(response);

  if (!response.ok) {
    if (!isApiErrorResponse(payload)) {
      throw new Error('Invalid API error payload shape.');
    }

    throw new TodosApiError(payload.error.code, payload.error.message, response.status);
  }

  if (!isToggleTodoResponse(payload)) {
    throw new Error('Invalid toggle todo payload shape.');
  }

  return payload;
};
