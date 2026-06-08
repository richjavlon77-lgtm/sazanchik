/**
 * Lightweight in-memory rate limiter.
 * Safe for Vercel serverless (per-instance, ephemeral).
 * Each function instance gets its own counter — good enough for 99% of cases.
 *
 * For stricter enforcement across instances, use Redis or Vercel KV.
 */

type Entry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Entry>();

// Sweep stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }, 300_000).unref?.();
}

type RateLimitConfig = {
  /** Max requests allowed within the window */
  limit: number;
  /** Window duration in milliseconds (default 60_000 = 1 min) */
  windowMs: number;
};

const DEFAULT_CONFIG: RateLimitConfig = {
  limit: 5,
  windowMs: 60_000,
};

/**
 * Returns `{ allowed, remaining, resetAt }` for a given key.
 * If `allowed` is false, the caller should reject with 429.
 */
export function checkRateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetAt: number } {
  const { limit, windowMs } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();

  let entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(key, entry);
    return { allowed: true, remaining: limit - 1, resetAt: entry.resetAt };
  }

  entry.count += 1;
  const allowed = entry.count <= limit;
  const remaining = Math.max(0, limit - entry.count);

  return { allowed, remaining, resetAt: entry.resetAt };
}

/**
 * Express-style middleware helper for route handlers.
 * Returns the parsed `remaining` header value or sets `Retry-After`.
 */
export function rateLimitResponse(
  key: string,
  config?: Partial<RateLimitConfig>
): {
  status: number;
  headers: Record<string, string>;
} {
  const result = checkRateLimit(key, config);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Limit": String(config?.limit ?? DEFAULT_CONFIG.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(result.resetAt),
      },
    };
  }

  return {
    status: 200,
    headers: {
      "X-RateLimit-Remaining": String(result.remaining),
      "X-RateLimit-Reset": String(result.resetAt),
    },
  };
}
