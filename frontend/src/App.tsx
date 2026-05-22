import { EmptyState } from './components/EmptyState';
import { ErrorState } from './components/ErrorState';
import { LoadingState } from './components/LoadingState';
import { TodoInput } from './components/TodoInput';
import { TodoList } from './components/TodoList';
import { useCreateTodo } from './hooks/useCreateTodo';
import { useTodos } from './hooks/useTodos';

function App() {
  const { data, isError, isFetching, isPending, refetch } = useTodos();
  const { createTodo, retryCreate } = useCreateTodo();

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
            <TodoList onRetryCreate={retryCreate} todos={todos} />
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
