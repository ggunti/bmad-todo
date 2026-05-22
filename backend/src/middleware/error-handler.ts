import { createHash } from 'crypto';
import type { ErrorRequestHandler } from 'express';
import { SESSION_COOKIE_NAME } from './session.js';

const hashSessionId = (sessionId: string) =>
  createHash('sha256').update(sessionId).digest('hex');

export const errorHandlerMiddleware: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const sessionIdFromContext =
    req.sessionId ?? req.cookies?.[SESSION_COOKIE_NAME] ?? 'unknown';
  const stackTrace = error instanceof Error ? error.stack ?? error.message : String(error);

  console.error('Unhandled server error', {
    path: req.path,
    sessionIdHash: hashSessionId(sessionIdFromContext),
    stack: stackTrace,
  });

  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong',
    },
  });
};
