import type { CookieOptions, Request, Response } from 'express';
import { SESSION_TTL_MS } from './auth.constants';

export const SESSION_COOKIE = 'flowtop_session';

/** httpOnly: no script can read it. Secure: HTTPS only (browsers treat localhost as secure). Lax: not sent on cross-site POSTs. */
const COOKIE_OPTIONS: CookieOptions = { httpOnly: true, secure: true, sameSite: 'lax', path: '/' };

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, { ...COOKIE_OPTIONS, maxAge: SESSION_TTL_MS });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, COOKIE_OPTIONS);
}

export function readSessionCookie(req: Request): string | undefined {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const value = cookies?.[SESSION_COOKIE];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
