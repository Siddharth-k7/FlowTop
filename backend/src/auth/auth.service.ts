import { Injectable } from '@nestjs/common';
import { ApiException } from '../common/errors/api.exception';
import { enforceRateLimit } from '../common/rate-limit/enforce-rate-limit';
import { RateLimiter } from '../common/rate-limit/rate-limiter';
import {
  AUTH_MESSAGES,
  AUTH_RATE_LIMITS,
  MFA_CHALLENGE_MAX_FAILURES,
  MFA_CHALLENGE_TTL_MS,
} from './auth.constants';
import { AuthUser } from './auth-user';
import { AuthRepository } from './auth.repository';
import { SecondFactorDto } from './mfa/mfa.dto';
import { MfaService } from './mfa/mfa.service';
import { PasswordHasher } from './password-hasher';
import { hashToken, newSecretToken } from './secret-token';
import { SessionService } from './session.service';

export interface SignedIn {
  requiresMfa: false;
  user: AuthUser;
  /** Goes into the session cookie, never into a response body. */
  sessionToken: string;
}

export interface MfaRequired {
  requiresMfa: true;
  mfaToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly hasher: PasswordHasher,
    private readonly sessions: SessionService,
    private readonly mfa: MfaService,
    private readonly rateLimiter: RateLimiter,
  ) {}

  /**
   * Unknown email, wrong password and deactivated account all get the same
   * message, and all pay for one argon2 verify, so neither the response nor
   * its timing says whether the account exists.
   */
  async login(email: string, password: string, ip: string): Promise<SignedIn | MfaRequired> {
    enforceRateLimit(this.rateLimiter.hit(`login:ip:${ip}`, AUTH_RATE_LIMITS.loginPerIp));
    const emailKey = `login:email:${email}`;
    enforceRateLimit(this.rateLimiter.check(emailKey, AUTH_RATE_LIMITS.loginFailuresPerEmail));

    const candidate = await this.repository.findLoginCandidate(email);
    const passwordMatches = candidate
      ? await this.hasher.verify(candidate.passwordHash, password)
      : await this.hasher.verifyAgainstDummy(password);

    if (!candidate || !passwordMatches || !candidate.isActive) {
      this.rateLimiter.hit(emailKey, AUTH_RATE_LIMITS.loginFailuresPerEmail);
      throw new ApiException('UNAUTHENTICATED', AUTH_MESSAGES.invalidCredentials);
    }

    this.rateLimiter.reset(emailKey);
    if (this.hasher.needsRehash(candidate.passwordHash)) {
      await this.repository.updatePasswordHash(candidate.id, await this.hasher.hash(password));
    }

    if (candidate.mfaEnabled) {
      const { token, tokenHash } = newSecretToken();
      await this.repository.createMfaChallenge(candidate.id, tokenHash, new Date(Date.now() + MFA_CHALLENGE_TTL_MS));
      return { requiresMfa: true, mfaToken: token };
    }
    return this.startSession(candidate.id);
  }

  /**
   * The second step, with a TOTP code or a recovery code. An mfaToken works
   * once, and so does each code: a replay of either is rejected.
   */
  async completeMfa(mfaToken: string, factor: SecondFactorDto, ip: string): Promise<SignedIn> {
    enforceRateLimit(this.rateLimiter.hit(`mfa:ip:${ip}`, AUTH_RATE_LIMITS.mfaPerIp));

    const now = new Date();
    const challenge = await this.repository.findMfaChallenge(hashToken(mfaToken));
    if (
      !challenge ||
      challenge.consumedAt ||
      challenge.expiresAt <= now ||
      !challenge.user.isActive ||
      !challenge.user.mfaSecret
    ) {
      throw new ApiException('UNAUTHENTICATED', AUTH_MESSAGES.mfaChallengeInvalid);
    }

    // Also enforces the per-account lock: 5 wrong codes in 15 minutes, across every MFA endpoint.
    if (!(await this.mfa.checkSecondFactor(challenge.userId, challenge.user.mfaSecret, factor))) {
      await this.repository.recordMfaFailure(challenge.id, MFA_CHALLENGE_MAX_FAILURES, now);
      throw new ApiException('UNAUTHENTICATED', AUTH_MESSAGES.mfaCodeInvalid);
    }

    // Atomic: if two requests race with the same token, only one gets past here.
    if (!(await this.repository.consumeMfaChallenge(challenge.id, now))) {
      throw new ApiException('UNAUTHENTICATED', AUTH_MESSAGES.mfaChallengeInvalid);
    }
    return this.startSession(challenge.userId);
  }

  async logout(sessionToken: string | undefined): Promise<void> {
    if (sessionToken) {
      await this.sessions.revoke(sessionToken);
    }
  }

  private async startSession(userId: string): Promise<SignedIn> {
    const user = await this.repository.findActiveAuthUser(userId);
    if (!user) {
      throw new ApiException('UNAUTHENTICATED', AUTH_MESSAGES.invalidCredentials);
    }
    return { requiresMfa: false, user, sessionToken: await this.sessions.create(userId) };
  }
}
