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

  // Fetch new token
  tokenFetchPromise = fetch('/api/csrf-token')
    .then((res) => {
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
      tokenFetchPromise = null;
      throw err;
    });

  return tokenFetchPromise;
}

export function CsrfInput() {
  const [token, setToken] = useState<string | null>(cachedToken);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we already have a cached token, use it
    if (cachedToken) {
      setToken(cachedToken);
      return;
    }

    // Otherwise fetch the token
    fetchCsrfToken()
      .then((fetchedToken) => {
        setToken(fetchedToken);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to fetch CSRF token:', err);
        setError(err.message);
      });
  }, []);

  if (error) {
    // In development, show a warning but allow the form to render
    // In production, this should be handled more gracefully
    if (process.env.NODE_ENV === 'development') {
      console.warn('CSRF token fetch failed:', error);
    }
    return null;
  }

  // Don't render the input until we have a token
  // This prevents form submission without CSRF protection
  if (!token) {
    return null;
  }

  return (
    <input
      type="hidden"
      name="csrf_token"
      value={token}
      data-csrf-input
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
