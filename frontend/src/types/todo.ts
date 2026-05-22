export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  createState?: 'pending' | 'failed';
  retryText?: string;
  toggleState?: 'failed';
  retryCompleted?: boolean;
  deleteState?: 'failed';
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

export interface ToggleTodoRequest {
  completed: boolean;
}

export interface ToggleTodoResponse {
  todo: Todo;
}

export interface DeleteTodoResponse {
  success: true;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
