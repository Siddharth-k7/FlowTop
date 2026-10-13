import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiException } from '../common/errors/api.exception';
import { enforceRateLimit } from '../common/rate-limit/enforce-rate-limit';
import { RateLimiter } from '../common/rate-limit/rate-limiter';
import { Env } from '../config/env.validation';
import { AUTH_MESSAGES, AUTH_RATE_LIMITS, PASSWORD_RESET_TTL_MS } from './auth.constants';
import { PasswordHasher } from './password-hasher';
import { PasswordResetMailer } from './password-reset.mailer';
import { PasswordResetRepository } from './password-reset.repository';
import { hashToken, newSecretToken } from './secret-token';

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly repository: PasswordResetRepository,
    private readonly hasher: PasswordHasher,
    private readonly mailer: PasswordResetMailer,
    private readonly rateLimiter: RateLimiter,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /**
   * Starts the reset in the background and returns at once, so the caller
   * answers in the same time with the same message whether or not the email
   * belongs to an account. The returned promise never rejects; failures are
   * logged. Callers do not await it.
   */
  request(email: string, ip: string): Promise<void> {
    enforceRateLimit(this.rateLimiter.hit(`reset:ip:${ip}`, AUTH_RATE_LIMITS.resetRequestPerIp));
    if (!this.rateLimiter.hit(`reset:email:${email}`, AUTH_RATE_LIMITS.resetRequestPerEmail).allowed) {
      return Promise.resolve();
    }
    return this.issue(email).catch((error: unknown) => {
      this.logger.error('Password reset could not be issued', error instanceof Error ? error.stack : undefined);
    });
  }

  /** Sets the new password, ends every session for the user, and burns the token. */
  async confirm(token: string, password: string, ip: string): Promise<void> {
    enforceRateLimit(this.rateLimiter.hit(`reset-confirm:ip:${ip}`, AUTH_RATE_LIMITS.resetConfirmPerIp));

    const now = new Date();
    const record = await this.repository.findToken(hashToken(token));
    if (!record || record.consumedAt || record.expiresAt <= now) {
      throw invalidToken();
    }

    const passwordHash = await this.hasher.hash(password);
    if (!(await this.repository.redeemToken(record.id, record.userId, passwordHash, now))) {
      throw invalidToken();
    }
  }

  private async issue(email: string): Promise<void> {
    const userId = await this.repository.findActiveUserIdByEmail(email);
    if (!userId) {
      return;
    }

    const now = new Date();
    const { token, tokenHash } = newSecretToken();
    await this.repository.issueToken(userId, tokenHash, new Date(now.getTime() + PASSWORD_RESET_TTL_MS), now);

    const resetUrl = new URL('/reset-password', this.config.get('ADMIN_URL', { infer: true }));
    resetUrl.searchParams.set('token', token);
    await this.mailer.sendPasswordReset(email, resetUrl.toString());
  }
}

function invalidToken(): ApiException {
  return new ApiException('VALIDATION_FAILED', AUTH_MESSAGES.resetTokenInvalid, {
    token: AUTH_MESSAGES.resetTokenInvalid,
  });
}
