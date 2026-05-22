import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';

const SESSION_COOKIE_PATTERN = /sessionId=[^;]+/;
const asCookieArray = (headerValue: string | string[] | undefined) =>
  Array.isArray(headerValue)
    ? headerValue
    : typeof headerValue === 'string'
      ? [headerValue]
      : [];

describe('session middleware', () => {
  const originalCookieSecure = process.env.COOKIE_SECURE;

  afterEach(() => {
    process.env.COOKIE_SECURE = originalCookieSecure;
  });

  it('issues a session cookie for new visitors', async () => {
    const response = await request(app).get('/api/health');
    const cookieHeader = asCookieArray(response.headers['set-cookie']);
    const sessionCookie = cookieHeader.find((cookie: string) =>
      cookie.startsWith('sessionId='),
    );

    expect(response.status).toBe(200);
    expect(sessionCookie).toMatch(SESSION_COOKIE_PATTERN);
    expect(sessionCookie).toContain('HttpOnly');
    expect(sessionCookie).toContain('SameSite=Lax');
    expect(sessionCookie).toContain('Path=/');
    expect(sessionCookie).toContain('Max-Age=7776000');
    expect(response.headers['x-dns-prefetch-control']).toBe('off');
  });

  it('reuses an existing session cookie without rotating it', async () => {
    const firstResponse = await request(app).get('/api/health');
    const firstSessionCookie = asCookieArray(firstResponse.headers['set-cookie']).find((cookie) =>
      cookie.startsWith('sessionId='),
    );

    expect(firstSessionCookie).toBeDefined();

    const secondResponse = await request(app)
      .get('/api/health')
      .set('Cookie', firstSessionCookie as string);

    const secondSetCookie = asCookieArray(secondResponse.headers['set-cookie']).find((cookie) =>
      cookie.startsWith('sessionId='),
    );

    expect(secondResponse.status).toBe(200);
    expect(secondSetCookie).toBeUndefined();
  });

  it('sets secure flag when COOKIE_SECURE is true', async () => {
    process.env.COOKIE_SECURE = 'true';

    const response = await request(app).get('/api/health');
    const sessionCookie = asCookieArray(response.headers['set-cookie']).find((cookie) =>
      cookie.startsWith('sessionId='),
    );

    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toContain('Secure');
  });
});
