import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

type Duration = `${number} ${"ms" | "s" | "m" | "h" | "d"}`;

type LimiterConfig = {
  limit: number;
  window: Duration;
};

const LIMITER_CONFIGS = {
  login: { limit: 5, window: "15 m" },
  register: { limit: 3, window: "1 h" },
  forgotPassword: { limit: 3, window: "1 h" },
  resetPassword: { limit: 5, window: "15 m" },
  resendVerification: { limit: 3, window: "15 m" },
} as const satisfies Record<string, LimiterConfig>;

export type LimiterName = keyof typeof LIMITER_CONFIGS;

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis =
  url && token ? new Redis({ url, token }) : null;

const limiters: Partial<Record<LimiterName, Ratelimit>> = {};

function getLimiter(name: LimiterName): Ratelimit | null {
  if (!redis) return null;
  let limiter = limiters[name];
  if (!limiter) {
    const cfg = LIMITER_CONFIGS[name];
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(cfg.limit, cfg.window),
      prefix: `ratelimit:${name}`,
      analytics: false,
    });
    limiters[name] = limiter;
  }
  return limiter;
}

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

/**
 * Check rate limit for a given limiter + identifier.
 * Fails open (returns success) if Upstash is unavailable or unconfigured.
 */
export async function checkRateLimit(
  name: LimiterName,
  identifier: string,
): Promise<RateLimitResult> {
  const cfg = LIMITER_CONFIGS[name];
  const limiter = getLimiter(name);

  if (!limiter) {
    return {
      success: true,
      limit: cfg.limit,
      remaining: cfg.limit,
      reset: Date.now(),
    };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (err) {
    console.error(`Rate limit check failed for ${name}:`, err);
    return {
      success: true,
      limit: cfg.limit,
      remaining: cfg.limit,
      reset: Date.now(),
    };
  }
}

/**
 * Extract a client IP from common request headers, falling back to "unknown".
 * On Vercel, `x-forwarded-for` is the canonical source.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

/**
 * Build a 429 Too Many Requests response with a friendly message and
 * Retry-After header derived from the rate limit reset timestamp.
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const secondsUntilReset = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  const minutes = Math.ceil(secondsUntilReset / 60);
  const message =
    minutes <= 1
      ? "Too many attempts. Please try again in a moment."
      : `Too many attempts. Please try again in ${minutes} minutes.`;

  return NextResponse.json(
    { error: message, code: "rate-limited" },
    {
      status: 429,
      headers: {
        "Retry-After": String(secondsUntilReset),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(result.reset),
      },
    },
  );
}
