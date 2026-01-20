import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { rateLimiters, checkRateLimit, applyRateLimitHeaders } from '@/lib/rate-limit';

function generateCSP(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
  ].join('; ');
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Generate a unique nonce for CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // Apply rate limiting to authentication endpoints
  const isAuthRoute =
    pathname.startsWith('/api/auth/') ||
    pathname === '/login' ||
    pathname === '/register';

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

    // Add nonce header and CSP for this request
    responseWithHeaders.headers.set('x-nonce', nonce);
    responseWithHeaders.headers.set('Content-Security-Policy', generateCSP(nonce));

    return responseWithHeaders;
  }

  // Non-auth routes: proceed with normal session handling
  const sessionResponse = await updateSession(request);

  // Add nonce header and CSP for this request
  sessionResponse.headers.set('x-nonce', nonce);
  sessionResponse.headers.set('Content-Security-Policy', generateCSP(nonce));

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
