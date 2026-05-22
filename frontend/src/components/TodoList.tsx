import type { Todo } from '../types/todo';

interface TodoListProps {
  todos: Todo[];
}

export const TodoList = ({ todos }: TodoListProps) => (
  <ul className="todo-list">
    {todos.map((todo) => (
      <li className="todo-card" key={todo.id}>
        {todo.text}
      </li>
    ))}
  </ul>
);
