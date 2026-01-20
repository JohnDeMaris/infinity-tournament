/**
 * CSRF Token API Endpoint
 *
 * Returns the current CSRF token for client-side use.
 * The token is stored in an httpOnly cookie for security.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCsrfTokenFromRequest, setCsrfTokenCookie } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  const response = NextResponse.json({ success: true });

  // Get existing token or generate new one
  let token = getCsrfTokenFromRequest(request);

  if (!token) {
    token = setCsrfTokenCookie(response);
  }

  // Return token in response body (cookie is already set)
  return NextResponse.json({ token });
}

export const dynamic = 'force-dynamic';
