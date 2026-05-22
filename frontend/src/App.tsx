import { EmptyState } from './components/EmptyState';
import { ErrorState } from './components/ErrorState';
import { LoadingState } from './components/LoadingState';
import { TodoInput } from './components/TodoInput';
import { TodoList } from './components/TodoList';
import { useCreateTodo } from './hooks/useCreateTodo';
import { useDeleteTodo } from './hooks/useDeleteTodo';
import { useToggleTodo } from './hooks/useToggleTodo';
import { useTodos } from './hooks/useTodos';

function App() {
  const { data, isError, isFetching, isPending, refetch } = useTodos();
  const { createTodo, retryCreate } = useCreateTodo();
  const { deleteTodo, retryDelete } = useDeleteTodo();
  const { toggleTodo, retryToggle } = useToggleTodo();

  const showLoading = isPending || isFetching;
  const showError = isError && !showLoading;
  const todos = data?.todos ?? [];
  const showEmpty = !showLoading && !showError && todos.length === 0;

  return (
    <main className="app-shell">
      <div className="content-well">
        <h1 className="wordmark">todo-bmad</h1>
        <TodoInput onSubmit={(text) => createTodo({ text })} />
        <section className="todo-region">
          {showLoading && <LoadingState />}
          {showError && <ErrorState onRetry={() => void refetch()} />}
          {showEmpty && <EmptyState />}
          {!showLoading && !showError && todos.length > 0 && (
            <TodoList
              onDeleteTodo={(todo, nextTodoId) =>
                deleteTodo({
                  id: todo.id,
                  focusTarget: nextTodoId
                    ? { type: 'next-row', todoId: nextTodoId }
                    : { type: 'input' },
                })
              }
              onRetryCreate={retryCreate}
              onRetryDelete={retryDelete}
              onRetryToggle={retryToggle}
              onToggleTodo={(todo, completed) => toggleTodo({ id: todo.id, completed })}
              todos={todos}
            />
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
