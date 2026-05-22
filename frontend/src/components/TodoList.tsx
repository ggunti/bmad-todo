import type { Todo } from '../types/todo';

interface TodoListProps {
  todos: Todo[];
  onRetryCreate: (todo: Todo) => void;
  onToggleTodo: (todo: Todo, completed: boolean) => void;
  onRetryToggle: (todo: Todo) => void;
  onDeleteTodo: (todo: Todo, nextTodoId: string | null) => void;
  onRetryDelete: (todo: Todo) => void;
}

const getCheckboxLabel = (todo: Todo) =>
  todo.completed ? `Mark incomplete: ${todo.text}` : `Mark complete: ${todo.text}`;

export const TodoList = ({
  todos,
  onRetryCreate,
  onToggleTodo,
  onRetryToggle,
  onDeleteTodo,
  onRetryDelete,
}: TodoListProps) => (
  <ul className="todo-list">
    {todos.map((todo, index) => (
      <li
        className={`todo-card ${
          todo.createState === 'failed' || todo.deleteState === 'failed' ? 'todo-card--failed' : ''
        }`}
        key={todo.id}
      >
        <div className="todo-row">
          <button
            aria-checked={todo.completed}
            aria-label={getCheckboxLabel(todo)}
            className="todo-checkbox-hit-area"
            onClick={() => onToggleTodo(todo, !todo.completed)}
            onKeyDown={(event) => {
              if (event.key === ' ' || event.key === 'Spacebar') {
                event.preventDefault();
                onToggleTodo(todo, !todo.completed);
              }
            }}
            role="checkbox"
            type="button"
          >
            <span className={`todo-checkbox ${todo.completed ? 'todo-checkbox--completed' : ''}`}>
              {todo.completed && <span className="todo-checkbox-checkmark">✓</span>}
            </span>
          </button>
          <span className={`todo-text ${todo.completed ? 'todo-text--completed' : ''}`}>
            {todo.text}
            {todo.completed && <span aria-hidden="true" className="todo-text-diagonal-line" />}
          </span>
          <button
            aria-label={`Delete: ${todo.text}`}
            className="todo-delete-button"
            data-delete-button-id={todo.id}
            onClick={() => onDeleteTodo(todo, todos[index + 1]?.id ?? null)}
            type="button"
          >
            ×
          </button>
        </div>
        {todo.createState === 'failed' && (
          <div className="todo-failure-indication" role="status">
            <span aria-hidden="true" className="todo-warning-glyph">
              ⚠
            </span>
            <span>This item failed to save.</span>
            <button className="todo-inline-retry" onClick={() => onRetryCreate(todo)} type="button">
              Retry
            </button>
          </div>
        )}
        {todo.toggleState === 'failed' && (
          <div className="todo-failure-indication" role="status">
            <span aria-hidden="true" className="todo-warning-glyph">
              ⚠
            </span>
            <span>This item failed to update.</span>
            <button className="todo-inline-retry" onClick={() => onRetryToggle(todo)} type="button">
              Retry
            </button>
          </div>
        )}
        {todo.deleteState === 'failed' && (
          <div className="todo-failure-indication" role="status">
            <span aria-hidden="true" className="todo-warning-glyph">
              ⚠
            </span>
            <span>Couldn&apos;t delete — try again.</span>
            <button
              aria-label={`Retry delete: ${todo.text}`}
              className="todo-inline-retry"
              onClick={() => onRetryDelete(todo)}
              type="button"
            >
              Retry
            </button>
          </div>
        )}
      </li>
    ))}
  </ul>
);
