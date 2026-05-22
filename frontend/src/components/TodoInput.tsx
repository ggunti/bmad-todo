import { useEffect, useRef, useState } from 'react';
import { validateCreateTodoText } from '../validation/todo';

interface TodoInputProps {
  onSubmit: (text: string) => void;
}

export const TodoInput = ({ onSubmit }: TodoInputProps) => {
  const [text, setText] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    const result = validateCreateTodoText(text);

    if (!result.isValid) {
      setValidationMessage(result.message);

      if (result.shouldClearInput) {
        setText('');
      }

      focusInput();
      return;
    }

    onSubmit(result.normalizedText);
    setValidationMessage(null);
    setText('');
    focusInput();
  };

  const onInputChange = (value: string) => {
    if (validationMessage) {
      setValidationMessage(null);
    }

    setText(value);
  };

  return (
    <div className="todo-input-shell">
      <div className="todo-input-controls">
        <input
          aria-label="New todo"
          className="todo-input"
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="What needs doing?"
          ref={inputRef}
          type="text"
          value={text}
        />
        <button className="add-button" onClick={handleSubmit} type="button">
          Add
        </button>
      </div>
      <p aria-live="polite" className="todo-input-message" role={validationMessage ? 'status' : undefined}>
        {validationMessage ?? ''}
      </p>
    </div>
  );
};
