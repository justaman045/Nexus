// Best-effort in-memory rate limiter. Serverless instances get an independent
// bucket, so this raises the cost of abuse without replacing a real edge/WAF
// limiter. Keys are per-route name + client IP.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export interface RateLimitOptions {
  /** Unique bucket name, e.g. "products:create". */
  name: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  retryAfter: number;
}

export function rateLimit(req: Request, { name, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();

  if (now - lastSweep > 60_000) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
    lastSweep = now;
  }

  const key = `${name}:${clientIp(req)}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

/** Test helper — reset all buckets between cases. */
export function resetRateLimits(): void {
  buckets.clear();
  lastSweep = 0;
}
