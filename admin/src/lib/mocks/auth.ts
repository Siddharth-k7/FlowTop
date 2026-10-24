import type { User } from '@/types';

// TODO: swap for real API (Dev A /auth/*)
export const mockUsers: Record<string, { password: string; user: User }> = {
  'admin@flowtop.in': {
    password: 'flowtop123',
    user: { id: 'u1', name: 'Asha Rao', email: 'admin@flowtop.in', role: 'super_admin', mfaEnabled: true,
      permissions: ['product:write', 'page:write', 'section:write', 'journal:write', 'media:write', 'order:read', 'order:export', 'submission:read', 'navigation:write', 'settings:write', 'user:read'] },
  },
  'priya@flowtop.in': {
    password: 'flowtop123',
    user: { id: 'u2', name: 'Priya Nair', email: 'priya@flowtop.in', role: 'marketing_admin', mfaEnabled: false,
      permissions: ['page:write', 'section:write', 'journal:write', 'media:write', 'product:write', 'navigation:write'] },
  },
  // Super admin who has not set up MFA yet: every call but /auth/mfa/* gets 403 MFA_SETUP_REQUIRED.
  'new@flowtop.in': {
    password: 'flowtop123',
    user: { id: 'u3', name: 'Ravi Menon', email: 'new@flowtop.in', role: 'super_admin', mfaEnabled: false,
      permissions: ['product:write', 'page:write', 'media:write', 'settings:write', 'user:read'] },
  },
};
export const MOCK_MFA_CODE = '123456';
export const MOCK_RECOVERY_CODE = 'RECOVERY-0001';
export const SESSION_COOKIE = 'ft_session';
