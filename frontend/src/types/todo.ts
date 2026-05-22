export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createState?: 'pending' | 'failed';
  retryText?: string;
}

export interface TodosResponse {
  todos: Todo[];
}

export interface CreateTodoRequest {
  text: string;
}

export interface CreateTodoResponse {
  todo: Todo;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
