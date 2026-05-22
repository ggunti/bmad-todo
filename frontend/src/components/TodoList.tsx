import type { Todo } from '../types/todo';

interface TodoListProps {
  todos: Todo[];
  onRetryCreate: (todo: Todo) => void;
}

export const TodoList = ({ todos, onRetryCreate }: TodoListProps) => (
  <ul className="todo-list">
    {todos.map((todo) => (
      <li className={`todo-card ${todo.createState === 'failed' ? 'todo-card--failed' : ''}`} key={todo.id}>
        <span>{todo.text}</span>
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
      </li>
    ))}
  </ul>
);
