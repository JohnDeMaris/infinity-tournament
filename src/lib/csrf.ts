/**
 * CSRF Token Generation and Validation Utilities
 *
 * Provides secure CSRF protection for forms and server actions.
 * Tokens are stored in httpOnly cookies and validated on the server.
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const CSRF_TOKEN_NAME = 'csrf_token';
const CSRF_TOKEN_LENGTH = 32; // 256 bits
const TOKEN_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds

/**
 * Generate a cryptographically secure random CSRF token
 * @returns A base64url-encoded random token
 */
export function generateCsrfToken(): string {
  // Use Node.js crypto for secure random generation
  const buffer = new Uint8Array(CSRF_TOKEN_LENGTH);
  crypto.getRandomValues(buffer);

  // Convert to base64url (URL-safe base64 without padding)
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Get the current CSRF token from cookies, or generate a new one
 * Server-side only - uses next/headers
 * @returns The current CSRF token
 */
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_TOKEN_NAME)?.value;

  if (!token) {
    token = generateCsrfToken();
    // Note: Setting cookies here requires this to be called during rendering
    // For middleware or API routes, use setCsrfTokenCookie instead
    cookieStore.set(CSRF_TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: TOKEN_MAX_AGE,
      path: '/',
    });
  }

  return token;
}

/**
 * Set CSRF token in response cookies (for middleware/API routes)
 * @param response The NextResponse object to set cookies on
 * @param token Optional token to set (generates new one if not provided)
 * @returns The token that was set
 */
export function setCsrfTokenCookie(
  response: NextResponse,
  token?: string
): string {
  const csrfToken = token || generateCsrfToken();

  response.cookies.set(CSRF_TOKEN_NAME, csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: TOKEN_MAX_AGE,
    path: '/',
  });

  return csrfToken;
}

/**
 * Get CSRF token from request cookies (for middleware/API routes)
 * @param request The NextRequest object
 * @returns The CSRF token or undefined if not found
 */
export function getCsrfTokenFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get(CSRF_TOKEN_NAME)?.value;
}

/**
 * Validate a submitted CSRF token against the token in the cookie
 * Server-side only - uses next/headers
 * @param submittedToken The token submitted by the client
 * @returns true if valid, false otherwise
 */
export async function validateCsrfToken(submittedToken: string | null | undefined): Promise<boolean> {
  if (!submittedToken) {
    return false;
  }

  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;

  if (!cookieToken) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  return timingSafeEqual(submittedToken, cookieToken);
}

/**
 * Validate CSRF token from request (for middleware/API routes)
 * @param request The NextRequest object
 * @param submittedToken The token submitted by the client
 * @returns true if valid, false otherwise
 */
export function validateCsrfTokenFromRequest(
  request: NextRequest,
  submittedToken: string | null | undefined
): boolean {
  if (!submittedToken) {
    return false;
  }

  const cookieToken = request.cookies.get(CSRF_TOKEN_NAME)?.value;

  if (!cookieToken) {
    return false;
  }

  return timingSafeEqual(submittedToken, cookieToken);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 * @param a First string
 * @param b Second string
 * @returns true if strings are equal, false otherwise
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Extract CSRF token from FormData
 * @param formData The FormData object
 * @returns The CSRF token or null
 */
export function getCsrfTokenFromFormData(formData: FormData): string | null {
  return formData.get('csrf_token') as string | null;
}

/**
 * Extract CSRF token from headers (for fetch requests)
 * @param headers The Headers object
 * @returns The CSRF token or null
 */
export function getCsrfTokenFromHeaders(headers: Headers): string | null {
  return headers.get('x-csrf-token');
}

/**
 * Validate CSRF token from FormData
 * Server-side only - uses next/headers
 * @param formData The FormData object
 * @returns true if valid, false otherwise
 */
export async function validateCsrfTokenFromFormData(formData: FormData): Promise<boolean> {
  const token = getCsrfTokenFromFormData(formData);
  return validateCsrfToken(token);
}

/**
 * Generate CSRF error response
 * @returns NextResponse with 403 status
 */
export function csrfErrorResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Invalid or missing CSRF token' },
    { status: 403 }
  );
}

/**
 * Type for server actions that require CSRF validation
 */
export type CsrfProtectedAction<T = void> = (
  formData: FormData
) => Promise<T>;

/**
 * Wrapper for server actions that enforces CSRF validation
 * @param action The server action to protect
 * @returns A CSRF-protected server action
 */
export function withCsrfProtection<T>(
  action: (formData: FormData) => Promise<T>
): CsrfProtectedAction<T> {
  return async (formData: FormData) => {
    const isValid = await validateCsrfTokenFromFormData(formData);

    if (!isValid) {
      throw new Error('Invalid or missing CSRF token');
    }

    return action(formData);
  };
}

/**
 * Validate CSRF token and throw error if invalid
 * Helper function for server actions that need CSRF protection
 * @param csrfToken The CSRF token to validate
 * @throws Error if token is invalid or missing
 */
export async function validateCsrfOrThrow(csrfToken: string | null | undefined): Promise<void> {
  const isValid = await validateCsrfToken(csrfToken);

  if (!isValid) {
    throw new Error('Invalid or missing CSRF token. Please refresh the page and try again.');
  }
}
