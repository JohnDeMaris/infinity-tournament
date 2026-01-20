/**
 * CSRF Protection Usage Examples
 *
 * This file demonstrates how to use the CSRF protection utilities
 * in different scenarios throughout the application.
 */

/* ============================================
 * EXAMPLE 1: Using CSRF in Server Actions
 * ============================================ */

// app/example/actions.ts
// 'use server';
//
// import { withCsrfProtection } from '@/lib/csrf';
//
// async function handleFormSubmitInternal(formData: FormData) {
//   const name = formData.get('name');
//   // ... process form data
//   return { success: true };
// }
//
// // Wrap the action with CSRF protection
// export const handleFormSubmit = withCsrfProtection(handleFormSubmitInternal);

/* ============================================
 * EXAMPLE 2: Using CSRF in React Forms (Client Component)
 * ============================================ */

// app/example/form-component.tsx
// 'use client';
//
// import { CsrfTokenInput } from '@/hooks/useCsrfToken';
// import { handleFormSubmit } from './actions';
//
// export function ExampleForm() {
//   return (
//     <form action={handleFormSubmit}>
//       <CsrfTokenInput />
//       <input name="name" type="text" required />
//       <button type="submit">Submit</button>
//     </form>
//   );
// }

/* ============================================
 * EXAMPLE 3: Using CSRF with fetch() in Client Component
 * ============================================ */

// app/example/fetch-component.tsx
// 'use client';
//
// import { useCsrfHeaders } from '@/hooks/useCsrfToken';
//
// export function ExampleFetchComponent() {
//   const csrfHeaders = useCsrfHeaders();
//
//   const handleClick = async () => {
//     if (!csrfHeaders) {
//       console.error('CSRF token not loaded yet');
//       return;
//     }
//
//     const response = await fetch('/api/example', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         ...csrfHeaders,
//       },
//       body: JSON.stringify({ data: 'example' }),
//     });
//
//     const result = await response.json();
//     console.log(result);
//   };
//
//   return <button onClick={handleClick}>Submit</button>;
// }

/* ============================================
 * EXAMPLE 4: Manual CSRF Validation in API Route
 * ============================================ */

// app/api/example/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { getCsrfTokenFromHeaders, validateCsrfTokenFromRequest, csrfErrorResponse } from '@/lib/csrf';
//
// export async function POST(request: NextRequest) {
//   // Get token from headers
//   const submittedToken = getCsrfTokenFromHeaders(request.headers);
//
//   // Validate token
//   if (!validateCsrfTokenFromRequest(request, submittedToken)) {
//     return csrfErrorResponse();
//   }
//
//   // Process request
//   const body = await request.json();
//   // ... handle request
//
//   return NextResponse.json({ success: true });
// }

/* ============================================
 * EXAMPLE 5: CSRF in Middleware (Optional)
 * ============================================ */

// middleware.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { getCsrfTokenFromRequest, setCsrfTokenCookie } from '@/lib/csrf';
//
// export async function middleware(request: NextRequest) {
//   const response = NextResponse.next();
//
//   // Ensure CSRF token exists for all requests
//   const token = getCsrfTokenFromRequest(request);
//   if (!token) {
//     setCsrfTokenCookie(response);
//   }
//
//   return response;
// }

/* ============================================
 * EXAMPLE 6: Server Component with CSRF Token
 * ============================================ */

// app/example/page.tsx
// import { getCsrfToken } from '@/lib/csrf';
//
// export default async function ExamplePage() {
//   const csrfToken = await getCsrfToken();
//
//   return (
//     <form action="/api/example" method="POST">
//       <input type="hidden" name="csrf_token" value={csrfToken} />
//       <input name="name" type="text" required />
//       <button type="submit">Submit</button>
//     </form>
//   );
// }

/* ============================================
 * EXAMPLE 7: Manual FormData Validation
 * ============================================ */

// app/example/actions.ts
// 'use server';
//
// import { validateCsrfTokenFromFormData } from '@/lib/csrf';
//
// export async function handleFormSubmit(formData: FormData) {
//   // Validate CSRF token
//   const isValid = await validateCsrfTokenFromFormData(formData);
//   if (!isValid) {
//     throw new Error('Invalid CSRF token');
//   }
//
//   // Process form data
//   const name = formData.get('name');
//   // ... handle submission
//
//   return { success: true };
// }

/* ============================================
 * SECURITY NOTES
 * ============================================ */

// 1. CSRF tokens are stored in httpOnly cookies to prevent XSS attacks
// 2. Tokens are validated using timing-safe comparison to prevent timing attacks
// 3. Tokens expire after 24 hours
// 4. Tokens are per-session and regenerated if missing
// 5. Always use HTTPS in production (secure flag is set automatically)
// 6. SameSite=Lax provides additional CSRF protection

/* ============================================
 * TESTING CSRF PROTECTION
 * ============================================ */

// To test CSRF protection:
// 1. Submit a form without CSRF token - should fail
// 2. Submit a form with invalid CSRF token - should fail
// 3. Submit a form with valid CSRF token - should succeed
// 4. Try to reuse an old CSRF token - should fail if expired

export {}; // Make this file a module
