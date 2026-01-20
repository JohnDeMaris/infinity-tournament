/**
 * React Hook for CSRF Token Management
 *
 * Provides easy access to CSRF tokens in client components.
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to fetch and manage CSRF token in client components
 * @returns The CSRF token or null if not yet loaded
 */
export function useCsrfToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Fetch CSRF token from API endpoint
    fetch('/api/csrf-token')
      .then((res) => res.json())
      .then((data) => setToken(data.token))
      .catch((error) => {
        console.error('Failed to fetch CSRF token:', error);
      });
  }, []);

  return token;
}

/**
 * Component for rendering hidden CSRF token input
 * @param props Component props with optional className
 */
export function CsrfTokenInput({ className }: { className?: string }) {
  const token = useCsrfToken();

  if (!token) {
    return null;
  }

  return (
    <input
      type="hidden"
      name="csrf_token"
      value={token}
      className={className}
    />
  );
}

/**
 * Hook to get CSRF headers for fetch requests
 * @returns Headers object with CSRF token or null if not yet loaded
 */
export function useCsrfHeaders(): HeadersInit | null {
  const token = useCsrfToken();

  if (!token) {
    return null;
  }

  return {
    'X-CSRF-Token': token,
  };
}
