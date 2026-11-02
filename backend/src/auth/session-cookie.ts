import type { CookieOptions, Request, Response } from 'express';
import { SESSION_TTL_MS } from './auth.constants';

export const SESSION_COOKIE = 'flowtop_session';

/** What SameSite the session cookie is allowed to take. The default is lax. */
export type SessionCookieSameSite = 'lax' | 'strict' | 'none';

/**
 * Defaults are the cookie as it has always shipped: SameSite=Lax, no Domain
 * (host-only). configureSessionCookie replaces them from env at boot.
 * httpOnly so no script can read it. Secure so it is HTTPS only (browsers treat localhost as secure).
 */
const DEFAULTS: { sameSite: SessionCookieSameSite; domain?: string } = { sameSite: 'lax' };

let configured: { sameSite: SessionCookieSameSite; domain?: string } = { ...DEFAULTS };

export function configureSessionCookie(options: { sameSite: SessionCookieSameSite; domain?: string }): void {
  configured = { sameSite: options.sameSite, domain: options.domain };
}

function cookieOptions(): CookieOptions {
  const options: CookieOptions = { httpOnly: true, secure: true, sameSite: configured.sameSite, path: '/' };
  if (configured.domain) {
    options.domain = configured.domain;
  }
  return options;
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: SESSION_TTL_MS });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
}

export function readSessionCookie(req: Request): string | undefined {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const value = cookies?.[SESSION_COOKIE];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
