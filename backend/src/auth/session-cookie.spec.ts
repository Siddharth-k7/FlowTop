import type { CookieOptions, Response } from 'express';
import { SESSION_TTL_MS } from './auth.constants';
import { configureSessionCookie, SESSION_COOKIE, setSessionCookie, clearSessionCookie } from './session-cookie';

interface Recorded {
  name: string;
  value: string;
  options: CookieOptions;
}

function fakeResponse(): { res: Response; set: Recorded[]; cleared: Recorded[] } {
  const set: Recorded[] = [];
  const cleared: Recorded[] = [];
  const res = {
    cookie(name: string, value: string, options: CookieOptions) {
      set.push({ name, value, options });
    },
    clearCookie(name: string, options: CookieOptions) {
      cleared.push({ name, value: '', options });
    },
  };
  return { res: res as unknown as Response, set, cleared };
}

describe('session cookie', () => {
  afterEach(() => {
    configureSessionCookie({ sameSite: 'lax' });
  });

  it('defaults to httpOnly, Secure, SameSite=Lax, path /, and no Domain', () => {
    const { res, set, cleared } = fakeResponse();

    setSessionCookie(res, 'token');
    clearSessionCookie(res);

    expect(set).toEqual([
      {
        name: SESSION_COOKIE,
        value: 'token',
        options: { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: SESSION_TTL_MS },
      },
    ]);
    expect(cleared[0].options).toEqual({ httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
    expect(cleared[0].options).not.toHaveProperty('domain');
  });

  it('uses the configured SameSite and Domain, and drops Domain when it is unset again', () => {
    configureSessionCookie({ sameSite: 'none', domain: '.flowtop.in' });
    const first = fakeResponse();
    setSessionCookie(first.res, 'token');
    expect(first.set[0].options.sameSite).toBe('none');
    expect(first.set[0].options.domain).toBe('.flowtop.in');
    expect(first.set[0].options.secure).toBe(true);

    configureSessionCookie({ sameSite: 'lax' });
    const second = fakeResponse();
    setSessionCookie(second.res, 'token');
    expect(second.set[0].options.sameSite).toBe('lax');
    expect(second.set[0].options).not.toHaveProperty('domain');
  });
});
