import { ClearAllDialog } from './ClearAllDialog';

interface FooterProps {
  todoCount: number;
  onConfirmClearAll: () => void;
}

export const Footer = ({ todoCount, onConfirmClearAll }: FooterProps) => (
  <footer className="todo-footer">
    <a className="cookie-link" href="/cookies.html">
      About cookies
    </a>
    {todoCount > 0 && <ClearAllDialog onConfirm={onConfirmClearAll} todoCount={todoCount} />}
  </footer>
);
