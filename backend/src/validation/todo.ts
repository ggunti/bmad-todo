import { z } from 'zod';

export const createTodoSchema = z.object({
  text: z
    .string()
    .superRefine((value, ctx) => {
      if (value.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Todo text cannot be empty',
        });
        return;
      }

      if (value.length > 1024) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Todo text cannot exceed 1024 characters',
        });
      }
    }),
});

export type CreateTodoInput = z.infer<typeof createTodoSchema>;

export const toggleTodoSchema = z.object({
  completed: z.boolean(),
});

export type ToggleTodoInput = z.infer<typeof toggleTodoSchema>;
