import type { Request } from 'express';

/**
 * The signed-in user, shaped as the User object in docs/03-api-contract.md.
 * `permissions` lets a frontend show and hide UI; the server re-checks on every call.
 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  /** The user's role name. Null only for a user with no role assigned yet. */
  role: string | null;
  permissions: string[];
  mfaEnabled: boolean;
  /**
   * True for a super admin without MFA (IAM-04: super admins must have it).
   * Such a session can only reach the MFA setup routes until MFA is on.
   */
  mfaSetupRequired: boolean;
}

/** A request that has passed AuthGuard. */
export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
