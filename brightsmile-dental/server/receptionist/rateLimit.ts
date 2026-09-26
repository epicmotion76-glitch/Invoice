/**
 * In-memory sliding-window rate limiter keyed by client IP.
 * Best-effort on serverless (each instance keeps its own counts). For hard limits across
 * instances, back this with a shared store (e.g. Redis/Upstash) or use Vercel Firewall rate limiting.
 */
export type RateLimitRule = { limit: number; windowMs: number };
export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export type RateLimiter = { check(key: string, now?: number): RateLimitResult };

const MAX_TRACKED_KEYS = 5000;

export function createRateLimiter(rules: RateLimitRule[]): RateLimiter {
  const longestWindow = Math.max(...rules.map((rule) => rule.windowMs));
  const hits = new Map<string, number[]>();

  return {
    check(key, now = Date.now()) {
      if (hits.size > MAX_TRACKED_KEYS) {
        for (const [trackedKey, times] of hits) {
          if (times[times.length - 1] <= now - longestWindow) hits.delete(trackedKey);
        }
        if (hits.size > MAX_TRACKED_KEYS) hits.clear();
      }

      const times = (hits.get(key) ?? []).filter((time) => time > now - longestWindow);
      for (const rule of rules) {
        const inWindow = times.filter((time) => time > now - rule.windowMs);
        if (inWindow.length >= rule.limit) {
          hits.set(key, times);
          return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((inWindow[0] + rule.windowMs - now) / 1000)) };
        }
      }
      times.push(now);
      hits.set(key, times);
      return { allowed: true };
    },
  };
}

/** Client IP as reported by Vercel's edge (it overwrites x-forwarded-for). */
export function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "anonymous";
}
