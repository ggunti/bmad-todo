import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTodo } from '../api/todos';
import type { Todo, TodosResponse } from '../types/todo';

interface CreateTodoVariables {
  text: string;
  replaceTodoId?: string;
}

interface CreateTodoContext {
  previousTodos?: TodosResponse;
  optimisticTodoId: string;
  text: string;
}

const TODO_QUERY_KEY = ['todos'] as const;

const createTemporaryTodo = (text: string, replaceTodoId?: string): Todo => {
  const nowIso = new Date().toISOString();

  return {
    id: replaceTodoId ?? `temp-${globalThis.crypto.randomUUID()}`,
    text,
    completed: false,
    sortOrder: Number.MAX_SAFE_INTEGER,
    createdAt: nowIso,
    updatedAt: nowIso,
    createState: 'pending',
  };
};

export const useCreateTodo = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ text }: CreateTodoVariables) => createTodo({ text }),
    onMutate: async ({ text, replaceTodoId }): Promise<CreateTodoContext> => {
      await queryClient.cancelQueries({ queryKey: TODO_QUERY_KEY });

      const previousTodos = queryClient.getQueryData<TodosResponse>(TODO_QUERY_KEY);
      const optimisticTodo = createTemporaryTodo(text, replaceTodoId);

      queryClient.setQueryData<TodosResponse>(TODO_QUERY_KEY, (current) => {
        const currentTodos = current?.todos ?? [];
        const filteredTodos = replaceTodoId
          ? currentTodos.filter((todo) => todo.id !== replaceTodoId)
          : currentTodos;

        return {
          todos: [optimisticTodo, ...filteredTodos],
        };
      });

      return {
        previousTodos,
        optimisticTodoId: optimisticTodo.id,
        text,
      };
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<TodosResponse>(TODO_QUERY_KEY, (current) => {
        if (!current) {
          return context.previousTodos;
        }

        const didReplace = current.todos.some((todo) => todo.id === context.optimisticTodoId);
        if (!didReplace) {
          return current;
        }

        return {
          todos: current.todos.map((todo) =>
            todo.id === context.optimisticTodoId
              ? {
                  ...todo,
                  createState: 'failed',
                  retryText: context.text,
                }
              : todo,
          ),
        };
      });
    },
    onSuccess: ({ todo }, _variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData<TodosResponse>(TODO_QUERY_KEY, (current) => {
        if (!current) {
          return { todos: [todo] };
        }

        return {
          todos: current.todos.map((item) => (item.id === context.optimisticTodoId ? todo : item)),
        };
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: TODO_QUERY_KEY, refetchType: 'none' });
    },
  });

  const retryCreate = (todo: Todo) => {
    const retryText = todo.retryText ?? todo.text;
    mutation.mutate({
      text: retryText,
      replaceTodoId: todo.id,
    });
  };

  return {
    createTodo: mutation.mutate,
    retryCreate,
  };
};
