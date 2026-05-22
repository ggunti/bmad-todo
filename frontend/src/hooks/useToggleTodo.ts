import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleTodoCompletion } from '../api/todos';
import type { Todo, TodosResponse } from '../types/todo';

interface ToggleTodoVariables {
  id: string;
  completed: boolean;
}

const TODO_QUERY_KEY = ['todos'] as const;

export const useToggleTodo = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, completed }: ToggleTodoVariables) => toggleTodoCompletion(id, { completed }),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: TODO_QUERY_KEY });

      queryClient.setQueryData<TodosResponse>(TODO_QUERY_KEY, (current) => {
        if (!current) {
          return current;
        }

        return {
          todos: current.todos.map((todo) =>
            todo.id === id
              ? {
                  ...todo,
                  completed,
                  toggleState: undefined,
                  retryCompleted: undefined,
                }
              : todo,
          ),
        };
      });

      return { id, completed };
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<TodosResponse>(TODO_QUERY_KEY, (current) => {
        if (!current) {
          return current;
        }

        return {
          todos: current.todos.map((todo) =>
            todo.id === context.id
              ? {
                  ...todo,
                  completed: context.completed,
                  toggleState: 'failed',
                  retryCompleted: context.completed,
                }
              : todo,
          ),
        };
      });
    },
    onSuccess: ({ todo }) => {
      queryClient.setQueryData<TodosResponse>(TODO_QUERY_KEY, (current) => {
        if (!current) {
          return { todos: [todo] };
        }

        return {
          todos: current.todos.map((currentTodo) => (currentTodo.id === todo.id ? todo : currentTodo)),
        };
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: TODO_QUERY_KEY, refetchType: 'none' });
    },
  });

  const retryToggle = (todo: Todo) => {
    mutation.mutate({
      id: todo.id,
      completed: todo.retryCompleted ?? todo.completed,
    });
  };

  return {
    toggleTodo: mutation.mutate,
    retryToggle,
  };
};
