'use client';

import { useEffect, useState, createContext, useContext, type ReactNode } from 'react';
import type { SyncEngine } from '@infinity-tournament/shared/sync';

interface SyncContextValue {
  engine: SyncEngine | null;
  isReady: boolean;
}

const SyncContext = createContext<SyncContextValue>({
  engine: null,
  isReady: false,
});

export function useSyncEngine() {
  return useContext(SyncContext);
}

interface SyncProviderProps {
  children: ReactNode;
}

/**
 * SyncProvider
 *
 * Initializes the offline sync engine and provides it via context.
 * Also registers the service worker for background sync.
 */
export function SyncProvider({ children }: SyncProviderProps) {
  const [engine, setEngine] = useState<SyncEngine | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initializeSync = async () => {
      try {
        // Dynamic import to avoid SSR issues with IndexedDB
        const { initializeSyncEngine, isIndexedDBSupported } = await import(
          '@infinity-tournament/shared/sync'
        );
        const { createClient } = await import('@/lib/supabase/client');

        // Check IndexedDB support
        if (!isIndexedDBSupported()) {
          console.warn('IndexedDB not supported - offline sync disabled');
          setIsReady(true);
          return;
        }

        // Initialize Supabase client
        const supabase = createClient();

        // Initialize sync engine
        // Cast to any to resolve type mismatch between app Supabase version and shared package
        const syncEngine = initializeSyncEngine({
          supabase: supabase as any,
          onStatusChange: (status) => {
            console.log('[Sync] Status changed:', status);
          },
          onConflict: (conflict) => {
            console.warn('[Sync] Conflict detected:', conflict);
            // TODO: Show UI for conflict resolution
          },
          syncInterval: 30000, // 30 seconds
        });

        // Start the sync engine
        syncEngine.start();

        setEngine(syncEngine);
        setIsReady(true);

        console.log('[Sync] Engine initialized and started');
      } catch (error) {
        console.error('[Sync] Failed to initialize:', error);
        setIsReady(true); // Mark ready even on error so app can continue
      }
    };

    initializeSync();

    // Cleanup on unmount
    return () => {
      if (engine) {
        engine.stop();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Register service worker
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });
          console.log('[SW] Registered:', registration.scope);
        } catch (error) {
          console.error('[SW] Registration failed:', error);
        }
      }
    };

    registerServiceWorker();
  }, []);

  return (
    <SyncContext.Provider value={{ engine, isReady }}>
      {children}
    </SyncContext.Provider>
  );
}
