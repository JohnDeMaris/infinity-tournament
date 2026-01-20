import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limit configuration for different endpoint types
 */
export interface RateLimitConfig {
  requests: number;
  window: `${number} ${"ms" | "s" | "m" | "h" | "d"}` | `${number}${"ms" | "s" | "m" | "h" | "d"}`;
  prefix?: string;
}

/**
 * Rate limit result with HTTP headers
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  headers: {
    "X-RateLimit-Limit": string;
    "X-RateLimit-Remaining": string;
    "X-RateLimit-Reset": string;
  };
}

// Initialize Redis client with error handling
let redis: Redis | null = null;
let redisAvailable = true;

try {
  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    });
  } else {
    console.warn(
      "[Rate Limit] Redis credentials not configured. Rate limiting will be disabled."
    );
    redisAvailable = false;
  }
} catch (error) {
  console.warn(
    "[Rate Limit] Failed to initialize Redis client. Rate limiting will be disabled.",
    error
  );
  redisAvailable = false;
}

/**
 * Factory function to create a rate limiter with custom configuration
 */
export function createRateLimiter(config: RateLimitConfig): Ratelimit | null {
  if (!redis || !redisAvailable) {
    return null;
  }

  try {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.requests, config.window),
      analytics: true,
      prefix: config.prefix || "@infinity-tournament/custom",
    });
  } catch (error) {
    console.warn(
      `[Rate Limit] Failed to create rate limiter for ${config.prefix}`,
      error
    );
    return null;
  }
}

// Pre-configured rate limiter instances for different use cases
export const rateLimiters = {
  // Global API rate limit: 10 requests per 10 seconds
  api: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "10 s"),
        analytics: true,
        prefix: "@infinity-tournament/api",
      })
    : null,

  // Authentication rate limit: 5 attempts per minute
  auth: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        analytics: true,
        prefix: "@infinity-tournament/auth",
      })
    : null,

  // Tournament creation: 3 per hour
  tournamentCreate: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "1 h"),
        analytics: true,
        prefix: "@infinity-tournament/tournament-create",
      })
    : null,
};

/**
 * Check rate limit and return result with proper HTTP headers.
 * Gracefully handles Redis unavailability by allowing the request.
 *
 * @param limiter - The rate limiter instance to use
 * @param identifier - Unique identifier for the rate limit (e.g., user ID, IP address)
 * @returns Rate limit result with success status and headers
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<RateLimitResult> {
  // Graceful fallback: allow request if Redis is unavailable
  if (!limiter || !redisAvailable) {
    if (!redisAvailable) {
      console.warn(
        "[Rate Limit] Redis unavailable, allowing request without rate limiting"
      );
    }

    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
      headers: {
        "X-RateLimit-Limit": "0",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": "0",
      },
    };
  }

  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    return {
      success,
      limit,
      remaining,
      reset,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
      },
    };
  } catch (error) {
    // Graceful fallback: allow request if rate limit check fails
    console.warn(
      "[Rate Limit] Failed to check rate limit, allowing request",
      error
    );

    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
      headers: {
        "X-RateLimit-Limit": "0",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": "0",
      },
    };
  }
}

/**
 * Helper function to apply rate limit headers to a Response
 */
export function applyRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): Response {
  const headers = new Headers(response.headers);
  headers.set("X-RateLimit-Limit", result.headers["X-RateLimit-Limit"]);
  headers.set("X-RateLimit-Remaining", result.headers["X-RateLimit-Remaining"]);
  headers.set("X-RateLimit-Reset", result.headers["X-RateLimit-Reset"]);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
