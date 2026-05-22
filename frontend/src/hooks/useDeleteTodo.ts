import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTodo } from '../api/todos';
import type { Todo, TodosResponse } from '../types/todo';

interface DeleteFocusTarget {
  type: 'next-row' | 'input';
  todoId?: string;
}

interface DeleteTodoVariables {
  id: string;
  focusTarget?: DeleteFocusTarget;
}

interface DeleteTodoContext {
  previousTodos?: TodosResponse;
  deletedTodo?: Todo;
}

const TODO_QUERY_KEY = ['todos'] as const;

const focusTodoDeleteTarget = (focusTarget?: DeleteFocusTarget) => {
  if (!focusTarget || typeof document === 'undefined') {
    return;
  }

  setTimeout(() => {
    if (focusTarget.type === 'next-row' && focusTarget.todoId) {
      const deleteButtons = document.querySelectorAll<HTMLButtonElement>('[data-delete-button-id]');
      for (const deleteButton of deleteButtons) {
        if (deleteButton.dataset.deleteButtonId === focusTarget.todoId) {
          deleteButton.focus();
          return;
        }
      }
      return;
    }

    const todoInput = document.querySelector<HTMLInputElement>('[data-todo-input="true"]');
    todoInput?.focus();
  }, 0);
};

export const useDeleteTodo = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id }: DeleteTodoVariables) => deleteTodo(id),
    onMutate: async ({ id, focusTarget }): Promise<DeleteTodoContext> => {
      await queryClient.cancelQueries({ queryKey: TODO_QUERY_KEY });

      const previousTodos = queryClient.getQueryData<TodosResponse>(TODO_QUERY_KEY);
      const deletedTodo = previousTodos?.todos.find((todo) => todo.id === id);

      queryClient.setQueryData<TodosResponse>(TODO_QUERY_KEY, (current) => {
        if (!current) {
          return current;
        }

        return {
          todos: current.todos.filter((todo) => todo.id !== id),
        };
      });

      focusTodoDeleteTarget(focusTarget);

      return {
        previousTodos,
        deletedTodo,
      };
    },
    onError: (_error, _variables, context) => {
      if (!context?.previousTodos || !context.deletedTodo) {
        return;
      }

      queryClient.setQueryData<TodosResponse>(TODO_QUERY_KEY, {
        todos: context.previousTodos.todos.map((todo) =>
          todo.id === context.deletedTodo?.id
            ? {
                ...todo,
                deleteState: 'failed',
              }
            : todo,
        ),
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: TODO_QUERY_KEY, refetchType: 'none' });
    },
  });

  const retryDelete = (todo: Todo) => {
    mutation.mutate({ id: todo.id });
  };

  return {
    deleteTodo: mutation.mutate,
    retryDelete,
  };
};
