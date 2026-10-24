import { api } from '@/lib/api';
import type { LoginResult, User } from '@/types';

// Session is an httpOnly cookie set by the API. Nothing is stored in localStorage.
export const login = (email: string, password: string) =>
  api<LoginResult>('/auth/login', { method: 'POST', body: { email, password }, redirectOn401: false });
/** Exactly one of `code` (6 digits) or `recoveryCode`. */
export const verifyMfa = (mfaToken: string, factor: { code: string } | { recoveryCode: string }) =>
  api<LoginResult>('/auth/mfa', { method: 'POST', body: { mfaToken, ...factor }, redirectOn401: false });
export const startMfaSetup = (password: string) =>
  api<{ secret: string; otpauthUri: string; expiresAt: string }>('/auth/mfa/setup', { method: 'POST', body: { password } });
export const confirmMfaSetup = (code: string) =>
  api<{ recoveryCodes: string[] }>('/auth/mfa/verify', { method: 'POST', body: { code } });
export const logout = () => api<null>('/auth/logout', { method: 'POST' });
export const currentUser = () => api<{ user: User }>('/auth/me').then((r) => r.user);
export const requestPasswordReset = (email: string) =>
  api('/auth/password-reset', { method: 'POST', body: { email }, redirectOn401: false });
export const confirmPasswordReset = (token: string, password: string) =>
  api('/auth/password-reset/confirm', { method: 'POST', body: { token, password }, redirectOn401: false });
