import { randomUUID } from 'crypto';
import type { RequestHandler } from 'express';

export const SESSION_COOKIE_NAME = 'sessionId';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

const isCookieSecureEnabled = () =>
  String(process.env.COOKIE_SECURE ?? 'false').toLowerCase() === 'true';

export const sessionMiddleware: RequestHandler = (req, res, next) => {
  const existingSessionId = req.cookies?.[SESSION_COOKIE_NAME];

  if (typeof existingSessionId === 'string' && existingSessionId.length > 0) {
    req.sessionId = existingSessionId;
    next();
    return;
  }

  const sessionId = randomUUID();

  req.sessionId = sessionId;
  res.cookie(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS * 1000,
    secure: isCookieSecureEnabled(),
  });

  next();
};
