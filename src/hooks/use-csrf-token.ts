'use client';

import { useState, useEffect } from 'react';

interface UseCsrfTokenResult {
  token: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage CSRF token for client-side forms and actions
 */
export function useCsrfToken(): UseCsrfTokenResult {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/csrf-token');
      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }
      const data = await response.json();
      setToken(data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch CSRF token');
      console.error('Error fetching CSRF token:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
  }, []);

  return {
    token,
    loading,
    error,
    refresh: fetchToken,
  };
}
