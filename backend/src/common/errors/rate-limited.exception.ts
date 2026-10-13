import { ApiException } from './api.exception';

/** 429 RATE_LIMITED. The exception filter turns retryAfterSeconds into a Retry-After header. */
export class RateLimitedException extends ApiException {
  constructor(
    readonly retryAfterSeconds: number,
    message = 'Too many attempts. Please wait a moment and try again.',
  ) {
    super('RATE_LIMITED', message);
  }
}
