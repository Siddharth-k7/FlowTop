import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError, FORBIDDEN_EVENT, toApiError } from '@/lib/api';

const respond = (status: number, body?: unknown) =>
  vi.fn(async () => new Response(body === undefined ? null : typeof body === 'string' ? body : JSON.stringify(body), { status }));

afterEach(() => vi.unstubAllGlobals());

describe('api() error mapping (real fetch path, mocks off)', () => {
  it('returns the unwrapped data on 2xx', async () => {
    vi.stubGlobal('fetch', respond(200, { data: { id: 'u1' } }));
    await expect(api('/auth/me')).resolves.toEqual({ id: 'u1' });
  });
  it('returns undefined on 204 with no body', async () => {
    vi.stubGlobal('fetch', respond(204));
    await expect(api('/auth/logout', { method: 'POST' })).resolves.toBeUndefined();
  });
  it('sends credentials and JSON to BASE + path', async () => {
    const f = respond(200, { data: null });
    vi.stubGlobal('fetch', f);
    await api('/admin/media/1', { method: 'PATCH', body: { altText: 'x' } });
    expect(f).toHaveBeenCalledWith('http://localhost:4000/api/v1/admin/media/1', expect.objectContaining({
      method: 'PATCH', credentials: 'include', body: '{"altText":"x"}', headers: { 'Content-Type': 'application/json' } }));
  });
  it('maps the error envelope to ApiError with code and fields', async () => {
    vi.stubGlobal('fetch', respond(422, { error: { code: 'VALIDATION_ERROR', message: 'Check the form', fields: { email: 'Required' } } }));
    const e = await api('/auth/login').catch((x) => x);
    expect(e).toBeInstanceOf(ApiError);
    expect(e).toMatchObject({ status: 422, code: 'VALIDATION_ERROR', message: 'Check the form', fields: { email: 'Required' } });
  });
  it('maps the 409 in-use message through unchanged', async () => {
    const message = 'This file is still in use: product "Chair" (main image). Remove it from there first.';
    vi.stubGlobal('fetch', respond(409, { error: { code: 'CONFLICT', message } }));
    await expect(api('/admin/media/1', { method: 'DELETE' })).rejects.toMatchObject({ status: 409, code: 'CONFLICT', message });
  });
  it('falls back to SERVER_ERROR on a non-JSON error body', async () => {
    vi.stubGlobal('fetch', respond(502, '<html>bad gateway</html>'));
    await expect(api('/x')).rejects.toMatchObject({ status: 502, code: 'SERVER_ERROR', message: 'Something went wrong.', fields: {} });
  });
  it('maps a fetch rejection to NETWORK (status 0)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    await expect(api('/x')).rejects.toMatchObject({ status: 0, code: 'NETWORK' });
  });
  it('fires the forbidden event on 403 in the browser', async () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal('window', { location: { pathname: '/users', assign: vi.fn() }, dispatchEvent });
    vi.stubGlobal('fetch', respond(403, { error: { code: 'FORBIDDEN', message: 'No' } }));
    await expect(api('/admin/users')).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: FORBIDDEN_EVENT }));
  });
  it('redirects to login with next on 401', async () => {
    const assign = vi.fn();
    vi.stubGlobal('window', { location: { pathname: '/media', assign }, dispatchEvent: vi.fn() });
    vi.stubGlobal('fetch', respond(401, { error: { code: 'UNAUTHENTICATED', message: 'Log in' } }));
    await expect(api('/admin/media')).rejects.toMatchObject({ status: 401 });
    expect(assign).toHaveBeenCalledWith('/login?next=%2Fmedia');
  });
  it('sends MFA_SETUP_REQUIRED to /mfa-setup', async () => {
    const assign = vi.fn();
    vi.stubGlobal('window', { location: { pathname: '/dashboard', assign }, dispatchEvent: vi.fn() });
    vi.stubGlobal('fetch', respond(403, { error: { code: 'MFA_SETUP_REQUIRED', message: 'Set up MFA' } }));
    await expect(api('/auth/me')).rejects.toMatchObject({ code: 'MFA_SETUP_REQUIRED' });
    expect(assign).toHaveBeenCalledWith('/mfa-setup');
  });
});

describe('toApiError', () => {
  it('handles a null body', () => expect(toApiError(500, null)).toMatchObject({ code: 'SERVER_ERROR', message: 'Something went wrong.' }));
});
