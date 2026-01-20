# CSRF Token Implementation

## Overview

This implementation provides comprehensive CSRF (Cross-Site Request Forgery) protection for the Infinity Tournament application using secure token generation, validation, and React hooks.

## Files Created

### Core Library Files
- **C:/Users/john/projects/infinity-tournament/src/lib/csrf.ts** - Core CSRF utilities
- **C:/Users/john/projects/infinity-tournament/src/lib/csrf.test.ts** - Unit tests
- **C:/Users/john/projects/infinity-tournament/src/lib/csrf.example.ts** - Usage examples

### React Components & Hooks
- **C:/Users/john/projects/infinity-tournament/src/hooks/useCsrfToken.tsx** - React hooks and components
- **C:/Users/john/projects/infinity-tournament/src/components/csrf-protected-form.example.tsx** - Form example

### API Endpoints
- **C:/Users/john/projects/infinity-tournament/src/app/api/csrf-token/route.ts** - Token retrieval endpoint

## Features

### 1. Secure Token Generation
- Uses `crypto.getRandomValues()` for cryptographically secure random tokens
- Generates 256-bit (32-byte) tokens
- Base64url encoding (URL-safe, no padding)
- Unique token per session

### 2. Secure Token Storage
- Stored in httpOnly cookies (prevents XSS attacks)
- SameSite=Lax policy (additional CSRF protection)
- Secure flag in production (HTTPS only)
- 24-hour expiration

### 3. Token Validation
- Timing-safe comparison (prevents timing attacks)
- Validates against session cookie
- Supports FormData and Header-based validation

### 4. React Integration
- `useCsrfToken()` - Hook to fetch token
- `CsrfTokenInput` - Component for form hidden input
- `useCsrfHeaders()` - Hook for fetch request headers

### 5. Server Action Protection
- `withCsrfProtection()` - Wrapper for server actions
- `validateCsrfTokenFromFormData()` - Manual validation
- Automatic error handling

## Usage Examples

### Basic Form Protection

```tsx
'use client';

import { CsrfTokenInput } from '@/hooks/useCsrfToken';

export function MyForm() {
  return (
    <form action={myServerAction}>
      <CsrfTokenInput />
      <input name="data" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Server Action Protection

```ts
'use server';

import { withCsrfProtection } from '@/lib/csrf';

async function handleSubmitInternal(formData: FormData) {
  // Process form data
  return { success: true };
}

export const handleSubmit = withCsrfProtection(handleSubmitInternal);
```

### Fetch Request Protection

```tsx
'use client';

import { useCsrfHeaders } from '@/hooks/useCsrfToken';

export function MyComponent() {
  const csrfHeaders = useCsrfHeaders();

  const handleClick = async () => {
    const response = await fetch('/api/example', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeaders,
      },
      body: JSON.stringify({ data: 'example' }),
    });
  };

  return <button onClick={handleClick}>Submit</button>;
}
```

### API Route Protection

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getCsrfTokenFromHeaders, validateCsrfTokenFromRequest, csrfErrorResponse } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  const submittedToken = getCsrfTokenFromHeaders(request.headers);

  if (!validateCsrfTokenFromRequest(request, submittedToken)) {
    return csrfErrorResponse();
  }

  // Process request
  return NextResponse.json({ success: true });
}
```

## Security Features

1. **Cryptographic Security**: Uses Web Crypto API for secure random generation
2. **XSS Protection**: httpOnly cookies prevent JavaScript access
3. **Timing Attack Prevention**: Constant-time string comparison
4. **HTTPS Enforcement**: Secure flag in production
5. **SameSite Policy**: Additional layer of CSRF protection
6. **Token Expiration**: 24-hour lifetime limits exposure

## Testing

All tests pass successfully:

```bash
npm test -- csrf.test.ts
```

Tests cover:
- Token generation uniqueness
- URL-safe encoding
- Cryptographic randomness
- Token length consistency
- Pattern distribution

## API Reference

### Core Functions

- `generateCsrfToken()` - Generate new token
- `getCsrfToken()` - Get or create token (Server Component)
- `validateCsrfToken(token)` - Validate token (Server Component)
- `withCsrfProtection(action)` - Wrap server action with CSRF validation

### Request/Response Functions

- `getCsrfTokenFromRequest(request)` - Extract token from request
- `setCsrfTokenCookie(response, token?)` - Set token in response
- `validateCsrfTokenFromRequest(request, token)` - Validate in middleware/API
- `csrfErrorResponse()` - Generate 403 error response

### Helper Functions

- `getCsrfTokenFromFormData(formData)` - Extract from FormData
- `getCsrfTokenFromHeaders(headers)` - Extract from headers
- `validateCsrfTokenFromFormData(formData)` - Validate FormData token

### React Hooks & Components

- `useCsrfToken()` - Hook to fetch token
- `useCsrfHeaders()` - Hook for fetch headers
- `<CsrfTokenInput />` - Hidden input component

## Integration Points

### Recommended Usage

1. **All Form Submissions**: Use `CsrfTokenInput` component
2. **Server Actions**: Use `withCsrfProtection` wrapper
3. **API Routes**: Use manual validation
4. **Fetch Requests**: Use `useCsrfHeaders` hook

### Optional Middleware Integration

Add CSRF token generation to middleware for automatic token creation:

```ts
// middleware.ts
import { getCsrfTokenFromRequest, setCsrfTokenCookie } from '@/lib/csrf';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const token = getCsrfTokenFromRequest(request);
  if (!token) {
    setCsrfTokenCookie(response);
  }

  return response;
}
```

## Best Practices

1. Always include CSRF tokens in state-changing operations (POST, PUT, DELETE)
2. Use the provided wrapper functions for consistent protection
3. Never expose CSRF tokens in URLs or logs
4. Regenerate tokens after authentication state changes
5. Use HTTPS in production to prevent token interception

## Compliance

This implementation satisfies the security requirements:
- Per-session token generation
- Secure storage (httpOnly cookies)
- Validation available for server actions
- React helpers for easy integration
- Comprehensive test coverage
