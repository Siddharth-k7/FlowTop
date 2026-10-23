import type { User } from '@flowtop/types';
import { permissionsFor } from './roles';

// Mock mode only (NEXT_PUBLIC_USE_MOCKS=true). Fake identities on a reserved test domain.
/** The one password every mock identity uses. Not a secret: mock mode never talks to a server. */
export const MOCK_PASSWORD = 'mock-password';

const mockUser = (id: string, name: string, email: string, role: NonNullable<User['role']>, mfaEnabled: boolean): User => ({
  id, name, email, role, mfaEnabled,
  // A super admin without MFA gets 403 MFA_SETUP_REQUIRED on every call but /auth/mfa/*.
  mfaSetupRequired: role === 'super_admin' && !mfaEnabled,
  permissions: permissionsFor(role),
});

export const mockUsers: Record<string, User> = Object.fromEntries([
  mockUser('u1', 'Asha Rao', 'admin@example.test', 'super_admin', true),
  mockUser('u2', 'Priya Nair', 'marketing@example.test', 'marketing_admin', false),
  mockUser('u3', 'Ravi Menon', 'new-admin@example.test', 'super_admin', false),
  mockUser('u4', 'Kiran Das', 'products@example.test', 'product_manager', false),
].map((u) => [u.email, u]));

export const MOCK_MFA_CODE = '123456';
export const MOCK_RECOVERY_CODE = 'RECOVERY-0001';
export const SESSION_COOKIE = 'ft_session';
