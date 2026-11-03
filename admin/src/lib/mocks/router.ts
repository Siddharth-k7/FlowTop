import { MOCK_MFA_CODE, MOCK_PASSWORD, MOCK_RECOVERY_CODE, SESSION_COOKIE, mockUsers } from './auth';
import { mockMedia, mockUsage } from './media';
import { mockDashboard } from './dashboard';
import type { MediaAsset } from '@flowtop/types';

// Mock mode only. lib/api.ts imports this file dynamically, and only when NEXT_PUBLIC_USE_MOCKS=true.
type Res = { status: number; json: unknown };
const ok = (data: unknown): Res => ({ status: 200, json: { data } });
const fail = (status: number, code: string, message: string, fields?: Record<string, string>): Res =>
  ({ status, json: { error: { code, message, fields } } });

const media: MediaAsset[] = [...mockMedia];
const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));

function sessionEmail(): string | null {
  const m = document.cookie.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return m?.[1] ? decodeURIComponent(m[1]) : null;
}
function startSession(email: string) {
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(email)}; path=/; SameSite=Lax`;
}

export async function mockRequest(path: string, method: string, body: unknown): Promise<Res> {
  await wait();
  const b = (body ?? {}) as Record<string, string>;
  const [route = '', query = ''] = path.split('?');
  const params = new URLSearchParams(query);

  if (route === '/auth/login') {
    const u = mockUsers[(b.email ?? '').toLowerCase()];
    if (!u || b.password !== MOCK_PASSWORD) return fail(401, 'UNAUTHENTICATED', 'Email or password is incorrect.');
    if (u.mfaEnabled) return ok({ requiresMfa: true, mfaToken: u.email });
    startSession(u.email);
    return ok({ requiresMfa: false, user: u });
  }
  if (route === '/auth/mfa') {
    const u = mockUsers[b.mfaToken ?? ''];
    if (!u || (b.code !== MOCK_MFA_CODE && b.recoveryCode !== MOCK_RECOVERY_CODE)) {
      const field = b.recoveryCode ? 'recoveryCode' : 'code';
      return fail(422, 'VALIDATION_FAILED', 'That code is not right.', { [field]: 'Check the code and try again.' });
    }
    startSession(u.email);
    return ok({ requiresMfa: false, user: u });
  }
  if (route === '/auth/logout') {
    document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0`;
    return { status: 204, json: null };
  }
  if (route === '/auth/password-reset') return ok({ sent: true });
  if (route === '/auth/password-reset/confirm') {
    return b.password && b.password.length >= 12
      ? ok({ reset: true })
      : fail(422, 'VALIDATION_FAILED', 'Password is too short.', { password: 'Use at least 12 characters.' });
  }

  const email = sessionEmail();
  const me = email ? mockUsers[email] : undefined;
  if (!me) return fail(401, 'UNAUTHENTICATED', 'Please log in.');
  if (route === '/auth/mfa/setup') {
    return b.password === MOCK_PASSWORD
      ? ok({ secret: 'JBSWY3DPEHPK3PXP', otpauthUri: `otpauth://totp/Flowtop:${me.email}?secret=JBSWY3DPEHPK3PXP&issuer=Flowtop`, expiresAt: new Date(Date.now() + 600_000).toISOString() })
      : fail(422, 'VALIDATION_FAILED', 'Password is incorrect.', { password: 'Check your password and try again.' });
  }
  if (route === '/auth/mfa/verify') {
    if (b.code !== MOCK_MFA_CODE) return fail(422, 'VALIDATION_FAILED', 'That code is not right.', { code: 'Check the code and try again.' });
    me.mfaEnabled = true;
    me.mfaSetupRequired = false;
    return ok({ recoveryCodes: Array.from({ length: 10 }, (_, i) => `RECOVERY-${String(i + 1).padStart(4, '0')}`) });
  }
  if (me.mfaSetupRequired) {
    return fail(403, 'MFA_SETUP_REQUIRED', 'Set up two-step sign-in before continuing.');
  }
  if (route === '/auth/me') return ok({ user: me });

  if (route === '/admin/users') {
    return me.permissions.includes('user:read') ? ok([]) : fail(403, 'FORBIDDEN', 'You do not have permission to manage users.');
  }
  if (route === '/admin/dashboard') return ok(mockDashboard);

  if (route === '/admin/media' && method === 'GET') {
    const q = (params.get('search') ?? '').toLowerCase();
    const t = params.get('type');
    // Same values as the API's type filter: image or document.
    return ok(media.filter((m) => m.filename.toLowerCase().includes(q)
      && (!t || (t === 'image' ? m.mimeType.startsWith('image/') : m.mimeType === 'application/pdf'))));
  }
  const id = route.match(/^\/admin\/media\/(.+)$/)?.[1];
  if (id) {
    const i = media.findIndex((m) => m.id === id);
    const item = media[i];
    if (!item) return fail(404, 'NOT_FOUND', 'That file no longer exists.');
    if (method === 'PATCH') { item.alt = b.altText ?? ''; return ok(item); }
    if (method === 'DELETE') {
      const usedBy = mockUsage[item.id];
      if (usedBy?.length) {
        return fail(409, 'CONFLICT', `This file is still in use: ${usedBy.join('; ')}. Remove it from there first.`);
      }
      media.splice(i, 1);
      return { status: 204, json: null };
    }
    return ok(item);
  }
  return fail(404, 'NOT_FOUND', 'Not found.');
}

/** Mock upload target: adds the file to the in-memory library. */
export function mockAddMedia(file: File, url: string): MediaAsset {
  const a: MediaAsset = {
    id: `m${Date.now()}${Math.random().toString(36).slice(2, 6)}`, url, alt: '', filename: file.name,
    width: 0, height: 0, sizeBytes: file.size, mimeType: file.type, createdAt: new Date().toISOString(),
    variants: { thumb: url, medium: url, large: url },
  };
  media.unshift(a);
  return a;
}
