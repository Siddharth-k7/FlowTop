import { RateLimitedException } from '../errors/rate-limited.exception';
import { RateLimitResult } from './rate-limiter';

/** Throws 429 RATE_LIMITED with Retry-After when a limit has been exceeded. */
export function enforceRateLimit(result: RateLimitResult): void {
  if (!result.allowed) {
    throw new RateLimitedException(result.retryAfterSeconds);
  }
}
