import { RateLimitRule } from '../common/rate-limit/rate-limiter';

const MINUTE = 60_000;

export const SESSION_TTL_MS = 12 * 60 * MINUTE;
export const MFA_CHALLENGE_TTL_MS = 5 * MINUTE;
export const MFA_CHALLENGE_MAX_FAILURES = 5;
export const PASSWORD_RESET_TTL_MS = 30 * MINUTE;
/** How long a secret from POST /auth/mfa/setup waits to be confirmed. */
export const MFA_SETUP_TTL_MS = 15 * MINUTE;
/** The name authenticator apps show next to the code. */
export const MFA_ISSUER = 'Flowtop';

export const AUTH_RATE_LIMITS = {
  /** Every login attempt from one IP. Phase 1 check 8: 20 failed logins in a minute must be limited. */
  loginPerIp: { limit: 10, windowMs: MINUTE },
  /** Failed logins against one email, from anywhere. Counts unknown emails too, so it reveals nothing. */
  loginFailuresPerEmail: { limit: 5, windowMs: 15 * MINUTE },
  mfaPerIp: { limit: 10, windowMs: MINUTE },
  /**
   * Wrong codes against one account, counted across login, setup and disable.
   * After 5 in 15 minutes every attempt is refused, a correct code included.
   */
  mfaFailuresPerUser: { limit: 5, windowMs: 15 * MINUTE },
  resetRequestPerIp: { limit: 5, windowMs: 15 * MINUTE },
  /** Over this, requests are dropped silently so the response still reveals nothing. */
  resetRequestPerEmail: { limit: 3, windowMs: 60 * MINUTE },
  resetConfirmPerIp: { limit: 10, windowMs: 15 * MINUTE },
} satisfies Record<string, RateLimitRule>;

export const AUTH_MESSAGES = {
  invalidCredentials: 'Email or password is incorrect.',
  signInRequired: 'Please sign in to continue.',
  mfaChallengeInvalid: 'This sign-in attempt has expired. Please sign in again.',
  mfaCodeInvalid: 'That code is not valid. Check your authenticator app and try again.',
  mfaLocked: 'Too many wrong codes. For your security, codes are blocked for 15 minutes.',
  mfaOneFactor: 'Enter either the 6-digit code from your authenticator app or a recovery code.',
  mfaAlreadyOn: 'Two-step sign-in is already on. Turn it off first to set it up again.',
  mfaNotOn: 'Two-step sign-in is not on for this account.',
  mfaSetupExpired: 'This setup has expired or was never started. Start again to get a new QR code.',
  mfaRequiredForSuperAdmin: 'Super admin accounts must keep two-step sign-in on.',
  mfaDisableInvalid: 'Password or code is incorrect.',
  mfaSetupRequired: 'Super admin accounts must set up two-step sign-in before doing anything else.',
  mfaSetupPasswordInvalid: 'Your password is incorrect.',
  resetRequested: 'If an account exists for that email, a password reset link is on its way.',
  resetTokenInvalid: 'This reset link has expired or has already been used. Please request a new one.',
} as const;
