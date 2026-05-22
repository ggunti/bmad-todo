const MAX_TODO_LENGTH = 1024;

export interface CreateTodoValidationResult {
  isValid: boolean;
  message: string | null;
  normalizedText: string;
  shouldClearInput: boolean;
}

export const validateCreateTodoText = (text: string): CreateTodoValidationResult => {
  const normalizedText = text.trim();

  if (normalizedText.length === 0) {
    return {
      isValid: false,
      message: 'Add some text first.',
      normalizedText: '',
      shouldClearInput: true,
    };
  }

  if (normalizedText.length > MAX_TODO_LENGTH) {
    return {
      isValid: false,
      message: 'Max 1024 characters — please shorten.',
      normalizedText,
      shouldClearInput: false,
    };
  }

  return {
    isValid: true,
    message: null,
    normalizedText,
    shouldClearInput: false,
  };
};

export { MAX_TODO_LENGTH };
