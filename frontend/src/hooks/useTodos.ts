import { useQuery } from '@tanstack/react-query';
import { getTodos } from '../api/todos';

export const useTodos = () =>
  useQuery({
    queryKey: ['todos'],
    queryFn: getTodos,
    retry: false,
  });
