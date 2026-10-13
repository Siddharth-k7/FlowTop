import { RateLimitRule } from '../common/rate-limit/rate-limiter';

const MINUTE = 60_000;

export const SESSION_TTL_MS = 12 * 60 * MINUTE;
export const MFA_CHALLENGE_TTL_MS = 5 * MINUTE;
export const MFA_CHALLENGE_MAX_FAILURES = 5;
export const PASSWORD_RESET_TTL_MS = 30 * MINUTE;

export const AUTH_RATE_LIMITS = {
  /** Every login attempt from one IP. Phase 1 check 8: 20 failed logins in a minute must be limited. */
  loginPerIp: { limit: 10, windowMs: MINUTE },
  /** Failed logins against one email, from anywhere. Counts unknown emails too, so it reveals nothing. */
  loginFailuresPerEmail: { limit: 5, windowMs: 15 * MINUTE },
  mfaPerIp: { limit: 10, windowMs: MINUTE },
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
  resetRequested: 'If an account exists for that email, a password reset link is on its way.',
  resetTokenInvalid: 'This reset link has expired or has already been used. Please request a new one.',
} as const;
