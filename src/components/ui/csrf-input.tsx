'use client';

import { useEffect, useState } from 'react';

/**
 * CSRF Token Hidden Input Component
 *
 * Automatically fetches and includes a CSRF token in forms.
 * The token is cached in memory for the session to avoid redundant API calls.
 */

// In-memory cache for the current session
let cachedToken: string | null = null;
let tokenFetchPromise: Promise<string> | null = null;

async function fetchCsrfToken(): Promise<string> {
  // Return cached token if available
  if (cachedToken) {
    return cachedToken;
  }

  // If already fetching, wait for that promise
  if (tokenFetchPromise) {
    return tokenFetchPromise;
  }

  // Fetch new token with 5-second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  tokenFetchPromise = fetch('/api/csrf-token', { signal: controller.signal })
    .then((res) => {
      clearTimeout(timeoutId);
      if (!res.ok) {
        throw new Error('Failed to fetch CSRF token');
      }
      return res.json();
    })
    .then((data) => {
      cachedToken = data.token;
      tokenFetchPromise = null;
      return data.token;
    })
    .catch((err) => {
      clearTimeout(timeoutId);
      tokenFetchPromise = null;
      if (err.name === 'AbortError') {
        throw new Error('CSRF token fetch timed out');
      }
      throw err;
    });

  return tokenFetchPromise;
}

export function CsrfInput() {
  const [token, setToken] = useState<string | null>(cachedToken);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!cachedToken);

  useEffect(() => {
    // If we already have a cached token, use it
    if (cachedToken) {
      setToken(cachedToken);
      setIsLoading(false);
      return;
    }

    // Otherwise fetch the token
    fetchCsrfToken()
      .then((fetchedToken) => {
        setToken(fetchedToken);
        setError(null);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch CSRF token:', err);
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  // Render hidden input with empty value while loading or on error
  // This allows the form to render immediately without blocking
  // Server-side validation will catch missing/invalid tokens on submit
  return (
    <input
      type="hidden"
      name="csrf_token"
      value={token || ''}
      data-csrf-input
      data-csrf-loading={isLoading}
      data-csrf-error={error || undefined}
    />
  );
}

/**
 * Clear the cached CSRF token (useful for testing or after logout)
 */
export function clearCsrfCache() {
  cachedToken = null;
  tokenFetchPromise = null;
}
