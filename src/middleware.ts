import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { rateLimiters, checkRateLimit, applyRateLimitHeaders } from '@/lib/rate-limit';

function generateCSP(): string {
  // Note: 'unsafe-inline' is required for Next.js scripts to work
  // until proper nonce propagation is implemented via Next.js 16's
  // experimental.serverActions.allowedOrigins or a custom Script component.
  // See: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.sentry.io https://*.sentry.io",
    "frame-ancestors 'none'",
  ].join('; ');
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Apply rate limiting to authentication API endpoints only
  // Note: We don't rate limit page views (/login, /register) - only actual auth actions
  const isAuthRoute = pathname.startsWith('/api/auth/');

  if (isAuthRoute) {
    // Use IP address as identifier for rate limiting (Next.js 16+ compatible)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      ?? request.headers.get('x-real-ip')
      ?? 'unknown';

    // Check rate limit (5 attempts per minute per IP)
    const rateLimitResult = await checkRateLimit(rateLimiters.auth, ip);

    if (!rateLimitResult.success) {
      // Rate limit exceeded - return 429 with clear error message
      const response = NextResponse.json(
        {
          error: 'Too many authentication attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        { status: 429 }
      );

      return applyRateLimitHeaders(response, rateLimitResult);
    }

    // Rate limit passed - continue with session update and apply headers
    const sessionResponse = await updateSession(request);
    const responseWithHeaders = applyRateLimitHeaders(sessionResponse, rateLimitResult);

    // Add CSP header
    responseWithHeaders.headers.set('Content-Security-Policy', generateCSP());

    return responseWithHeaders;
  }

  // Non-auth routes: proceed with normal session handling
  const sessionResponse = await updateSession(request);

  // Add CSP header
  sessionResponse.headers.set('Content-Security-Policy', generateCSP());

  return sessionResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
