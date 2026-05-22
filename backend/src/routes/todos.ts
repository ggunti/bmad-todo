import { Router } from 'express';
import { prisma } from '../prisma/client.js';
import { createTodoSchema } from '../validation/todo.js';

export const todosRouter = Router();

todosRouter.get('/', async (req, res, next) => {
  try {
    const todos = await prisma.todo.findMany({
      where: { sessionId: req.sessionId },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ todos });
  } catch (error) {
    next(error);
  }
});

todosRouter.post('/', async (req, res, next) => {
  try {
    const parsedBody = createTodoSchema.safeParse(req.body);

    if (!parsedBody.success) {
      const validationMessage = parsedBody.error.issues[0]?.message ?? 'Invalid request';

      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: validationMessage,
        },
      });
      return;
    }

    const minSortOrderResult = await prisma.todo.aggregate({
      where: { sessionId: req.sessionId },
      _min: { sortOrder: true },
    });
    const nextSortOrder =
      minSortOrderResult._min.sortOrder === null
        ? 0
        : minSortOrderResult._min.sortOrder - 1;

    const todo = await prisma.todo.create({
      data: {
        sessionId: req.sessionId,
        text: parsedBody.data.text,
        completed: false,
        sortOrder: nextSortOrder,
      },
    });

    res.status(201).json({ todo });
  } catch (error) {
    next(error);
  }
});
