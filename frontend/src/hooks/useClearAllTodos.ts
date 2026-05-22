import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { clearAllTodos as clearAllTodosRequest } from '../api/todos';
import type { TodosResponse } from '../types/todo';

interface ClearAllTodosContext {
  previousTodos?: TodosResponse;
}

const TODO_QUERY_KEY = ['todos'] as const;

export const useClearAllTodos = () => {
  const queryClient = useQueryClient();
  const [hasClearAllError, setHasClearAllError] = useState(false);

  const mutation = useMutation({
    mutationFn: clearAllTodosRequest,
    onMutate: async (): Promise<ClearAllTodosContext> => {
      await queryClient.cancelQueries({ queryKey: TODO_QUERY_KEY });

      const previousTodos = queryClient.getQueryData<TodosResponse>(TODO_QUERY_KEY);
      setHasClearAllError(false);

      queryClient.setQueryData<TodosResponse>(TODO_QUERY_KEY, { todos: [] });

      return { previousTodos };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData<TodosResponse>(TODO_QUERY_KEY, context.previousTodos);
      }

      setHasClearAllError(true);
    },
    onSuccess: () => {
      setHasClearAllError(false);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: TODO_QUERY_KEY, refetchType: 'none' });
    },
  });

  const retryClearAll = () => {
    mutation.mutate();
  };

  return {
    clearAllTodos: mutation.mutate,
    retryClearAll,
    hasClearAllError,
  };
};
