import * as Dialog from '@radix-ui/react-dialog';
import { useRef } from 'react';

interface ClearAllDialogProps {
  todoCount: number;
  onConfirm: () => void;
}

export const ClearAllDialog = ({ todoCount, onConfirm }: ClearAllDialogProps) => {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="clear-all-trigger" type="button">
          Clear all
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Close asChild>
          <Dialog.Overlay className="clear-all-overlay" />
        </Dialog.Close>
        <Dialog.Content
          aria-describedby="clear-all-description"
          aria-labelledby="clear-all-title"
          className="clear-all-content"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            cancelButtonRef.current?.focus();
          }}
        >
          <Dialog.Title className="clear-all-title" id="clear-all-title">
            Clear all todos?
          </Dialog.Title>
          <Dialog.Description className="clear-all-description" id="clear-all-description">
            This will delete all {todoCount} todos. This cannot be undone.
          </Dialog.Description>
          <div className="clear-all-actions">
            <Dialog.Close asChild>
              <button className="clear-all-cancel" ref={cancelButtonRef} type="button">
                Cancel
              </button>
            </Dialog.Close>
            <Dialog.Close asChild>
              <button className="clear-all-confirm" onClick={onConfirm} type="button">
                Clear all
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
