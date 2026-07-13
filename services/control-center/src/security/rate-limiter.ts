export type RateLimitPolicy = Readonly<{ limit: number; windowMs: number }>;

export type RateLimitPolicies = Readonly<{
  baseline: RateLimitPolicy;
  command: RateLimitPolicy;
  demo: RateLimitPolicy;
  ticket: RateLimitPolicy;
  websocket: RateLimitPolicy;
}>;

export const RATE_LIMIT_POLICIES: RateLimitPolicies = {
  baseline: { limit: 600, windowMs: 60_000 },
  command: { limit: 120, windowMs: 60_000 },
  demo: { limit: 30, windowMs: 60_000 },
  ticket: { limit: 20, windowMs: 60_000 },
  websocket: { limit: 60, windowMs: 60_000 },
};

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export interface RateLimiter {
  consume(key: string, policy: RateLimitPolicy): RateLimitResult;
}

type Entry = { count: number; resetAt: number };

export class InMemoryRateLimiter implements RateLimiter {
  private readonly entries = new Map<string, Entry>();
  private readonly now: () => number;
  private readonly maxEntries: number;

  constructor(options: { now?: () => number; maxEntries?: number } = {}) {
    this.now = options.now ?? Date.now;
    this.maxEntries = options.maxEntries ?? 10_000;
  }

  consume(key: string, policy: RateLimitPolicy): RateLimitResult {
    const now = this.now();
    this.removeExpired(now);
    let entry = this.entries.get(key);
    if (!entry) {
      if (this.entries.size >= this.maxEntries) {
        const oldestKey = this.entries.keys().next().value as string | undefined;
        if (oldestKey !== undefined) this.entries.delete(oldestKey);
      }
      entry = { count: 0, resetAt: now + policy.windowMs };
      this.entries.set(key, entry);
    }
    if (entry.count >= policy.limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1_000)),
      };
    }
    entry.count += 1;
    return { allowed: true };
  }

  private removeExpired(now: number): void {
    for (const [key, entry] of this.entries) {
      if (entry.resetAt <= now) this.entries.delete(key);
    }
  }
}
