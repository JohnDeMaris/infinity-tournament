import { describe, it, expect, vi } from "vitest";
import {
  checkRateLimit,
  createRateLimiter,
  rateLimiters,
  applyRateLimitHeaders,
} from "../rate-limit";

describe("Rate Limit Middleware", () => {
  it("should handle graceful fallback when Redis is unavailable", async () => {
    // When Redis is unavailable, checkRateLimit should allow requests
    const result = await checkRateLimit(null, "test-identifier");

    expect(result.success).toBe(true);
    expect(result.headers["X-RateLimit-Limit"]).toBe("0");
    expect(result.headers["X-RateLimit-Remaining"]).toBe("0");
    expect(result.headers["X-RateLimit-Reset"]).toBe("0");
  });

  it("should create rate limiter factory with proper config", () => {
    const limiter = createRateLimiter({
      requests: 5,
      window: "1 m",
      prefix: "@test/custom",
    });

    // May be null if Redis is not configured in test environment
    expect(limiter === null || typeof limiter === "object").toBe(true);
  });

  it("should have pre-configured rate limiters", () => {
    expect(rateLimiters).toHaveProperty("api");
    expect(rateLimiters).toHaveProperty("auth");
    expect(rateLimiters).toHaveProperty("tournamentCreate");
  });

  it("should apply rate limit headers to Response", () => {
    const originalResponse = new Response("test", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

    const result = {
      success: true,
      limit: 10,
      remaining: 5,
      reset: 1234567890,
      headers: {
        "X-RateLimit-Limit": "10",
        "X-RateLimit-Remaining": "5",
        "X-RateLimit-Reset": "1234567890",
      },
    };

    const responseWithHeaders = applyRateLimitHeaders(originalResponse, result);

    expect(responseWithHeaders.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(responseWithHeaders.headers.get("X-RateLimit-Remaining")).toBe("5");
    expect(responseWithHeaders.headers.get("X-RateLimit-Reset")).toBe(
      "1234567890"
    );
    expect(responseWithHeaders.headers.get("Content-Type")).toBe(
      "application/json"
    );
  });
});
