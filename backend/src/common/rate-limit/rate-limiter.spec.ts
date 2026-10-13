import { RateLimiter } from './rate-limiter';

class TestRateLimiter extends RateLimiter {
  time = 1_000_000;

  protected override now(): number {
    return this.time;
  }
}

describe('RateLimiter', () => {
  const rule = { limit: 3, windowMs: 60_000 };
  let limiter: TestRateLimiter;

  beforeEach(() => {
    limiter = new TestRateLimiter();
  });

  it('allows hits up to the limit and blocks the next one with a Retry-After', () => {
    expect(limiter.hit('k', rule).allowed).toBe(true);
    expect(limiter.hit('k', rule).allowed).toBe(true);
    expect(limiter.hit('k', rule).allowed).toBe(true);

    expect(limiter.hit('k', rule)).toEqual({ allowed: false, retryAfterSeconds: 60 });
  });

  it('opens again once the window has passed', () => {
    for (let i = 0; i < 4; i += 1) limiter.hit('k', rule);

    limiter.time += 60_000;

    expect(limiter.hit('k', rule).allowed).toBe(true);
  });

  it('check reports the state without counting an attempt', () => {
    limiter.hit('k', rule);
    limiter.hit('k', rule);

    expect(limiter.check('k', rule).allowed).toBe(true);
    expect(limiter.check('k', rule).allowed).toBe(true);

    limiter.hit('k', rule);
    expect(limiter.check('k', rule)).toEqual({ allowed: false, retryAfterSeconds: 60 });
  });

  it('keeps keys independent and reset clears one key', () => {
    for (let i = 0; i < 4; i += 1) limiter.hit('a', rule);

    expect(limiter.hit('b', rule).allowed).toBe(true);

    limiter.reset('a');
    expect(limiter.hit('a', rule).allowed).toBe(true);
  });
});
