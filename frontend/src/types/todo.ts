export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TodosResponse {
  todos: Todo[];
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
