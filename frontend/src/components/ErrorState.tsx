interface ErrorStateProps {
  onRetry: () => void;
}

export const ErrorState = ({ onRetry }: ErrorStateProps) => (
  <div className="todo-state todo-state--error" role="alert">
    <p>Couldn't load your todos.</p>
    <button aria-label="Retry loading todos" className="retry-button" onClick={onRetry} type="button">
      Retry
    </button>
  </div>
);
