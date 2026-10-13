import { Injectable } from '@nestjs/common';

export interface RateLimitRule {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

interface Window {
  count: number;
  resetAt: number;
}

const PRUNE_THRESHOLD = 10_000;

/**
 * Fixed-window counters keyed by any string, for example `login:ip:1.2.3.4`.
 *
 * In-memory, so limits are per API instance. Task 2.2 puts this behind Redis
 * and adds the reusable guard; callers keep the same hit/check/reset calls.
 */
@Injectable()
export class RateLimiter {
  private readonly windows = new Map<string, Window>();

  /** Counts one attempt against the key and says whether it is still within the limit. */
  hit(key: string, rule: RateLimitRule): RateLimitResult {
    const window = this.liveWindow(key, rule);
    window.count += 1;
    return this.result(window, rule);
  }

  /** Says whether the key is already over its limit, without counting an attempt. */
  check(key: string, rule: RateLimitRule): RateLimitResult {
    const window = this.windows.get(key);
    if (!window || window.resetAt <= this.now()) {
      return { allowed: true, retryAfterSeconds: 0 };
    }
    return { allowed: window.count < rule.limit, retryAfterSeconds: this.secondsUntil(window.resetAt) };
  }

  reset(key: string): void {
    this.windows.delete(key);
  }

  clear(): void {
    this.windows.clear();
  }

  protected now(): number {
    return Date.now();
  }

  private liveWindow(key: string, rule: RateLimitRule): Window {
    const now = this.now();
    const existing = this.windows.get(key);
    if (existing && existing.resetAt > now) {
      return existing;
    }
    if (this.windows.size >= PRUNE_THRESHOLD) {
      this.pruneExpired(now);
    }
    const fresh = { count: 0, resetAt: now + rule.windowMs };
    this.windows.set(key, fresh);
    return fresh;
  }

  private result(window: Window, rule: RateLimitRule): RateLimitResult {
    const allowed = window.count <= rule.limit;
    return { allowed, retryAfterSeconds: allowed ? 0 : this.secondsUntil(window.resetAt) };
  }

  private secondsUntil(timestamp: number): number {
    return Math.max(1, Math.ceil((timestamp - this.now()) / 1000));
  }

  private pruneExpired(now: number): void {
    for (const [key, window] of this.windows) {
      if (window.resetAt <= now) {
        this.windows.delete(key);
      }
    }
  }
}
