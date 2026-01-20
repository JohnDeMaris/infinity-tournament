/**
 * Rate Limiting Middleware Usage Examples
 *
 * This file demonstrates how to use the rate limiting middleware
 * in different scenarios (API routes, authentication, custom endpoints).
 */

import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  rateLimiters,
  createRateLimiter,
  applyRateLimitHeaders,
} from "./rate-limit";

// Helper to get IP from request headers (Next.js 16+ compatible)
function getIpFromRequest(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim()
    ?? request.headers.get("x-real-ip")
    ?? "anonymous";
}

/**
 * Example 1: Using pre-configured API rate limiter
 */
export async function exampleApiRoute(request: NextRequest) {
  // Get identifier (IP address or user ID)
  const identifier = getIpFromRequest(request);

  // Check rate limit
  const rateLimit = await checkRateLimit(rateLimiters.api, identifier);

  // If rate limited, return 429
  if (!rateLimit.success) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: rateLimit.headers,
    });
  }

  // Process request
  const response = NextResponse.json({ message: "Success" });

  // Apply rate limit headers
  return applyRateLimitHeaders(response, rateLimit);
}

/**
 * Example 2: Using pre-configured auth rate limiter
 */
export async function exampleAuthRoute(request: NextRequest) {
  const { email } = await request.json();

  // Check rate limit using email as identifier
  const rateLimit = await checkRateLimit(rateLimiters.auth, email);

  if (!rateLimit.success) {
    return new NextResponse(
      JSON.stringify({
        error: "Too many authentication attempts. Please try again later.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...rateLimit.headers,
        },
      }
    );
  }

  // Process authentication
  const response = NextResponse.json({ message: "Authentication successful" });
  return applyRateLimitHeaders(response, rateLimit);
}

/**
 * Example 3: Creating custom rate limiter for specific endpoint
 */
export async function exampleCustomRoute(request: NextRequest) {
  // Create custom rate limiter: 20 requests per minute
  const customLimiter = createRateLimiter({
    requests: 20,
    window: "1 m",
    prefix: "@infinity-tournament/custom-endpoint",
  });

  const identifier = getIpFromRequest(request);
  const rateLimit = await checkRateLimit(customLimiter, identifier);

  if (!rateLimit.success) {
    return new NextResponse("Rate limit exceeded", {
      status: 429,
      headers: rateLimit.headers,
    });
  }

  const response = NextResponse.json({ data: "Custom endpoint response" });
  return applyRateLimitHeaders(response, rateLimit);
}

/**
 * Example 4: Using tournament creation rate limiter
 */
export async function exampleTournamentCreateRoute(request: NextRequest) {
  // Get user ID from session/auth
  const userId = request.headers.get("x-user-id") ?? "anonymous";

  // Check rate limit
  const rateLimit = await checkRateLimit(
    rateLimiters.tournamentCreate,
    userId
  );

  if (!rateLimit.success) {
    const resetDate = new Date(rateLimit.reset * 1000);
    return new NextResponse(
      JSON.stringify({
        error: "Tournament creation limit reached",
        message: `You can create more tournaments after ${resetDate.toISOString()}`,
        resetAt: rateLimit.reset,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...rateLimit.headers,
        },
      }
    );
  }

  // Create tournament
  const response = NextResponse.json({ message: "Tournament created" });
  return applyRateLimitHeaders(response, rateLimit);
}

/**
 * Example 5: Using rate limiter in middleware
 */
export async function exampleMiddleware(request: NextRequest) {
  // Skip rate limiting for static files
  if (request.nextUrl.pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }

  const identifier = getIpFromRequest(request);

  // Apply different rate limits based on path
  let limiter = rateLimiters.api;
  if (request.nextUrl.pathname.startsWith("/api/auth/")) {
    limiter = rateLimiters.auth;
  } else if (request.nextUrl.pathname.startsWith("/api/tournaments/create")) {
    limiter = rateLimiters.tournamentCreate;
  }

  const rateLimit = await checkRateLimit(limiter, identifier);

  if (!rateLimit.success) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: rateLimit.headers,
    });
  }

  // Continue with request and add rate limit headers
  const response = NextResponse.next();
  return applyRateLimitHeaders(response, rateLimit);
}
