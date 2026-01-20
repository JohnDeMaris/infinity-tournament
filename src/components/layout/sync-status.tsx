'use client';

import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type SyncStatusType = 'idle' | 'syncing' | 'offline' | 'error';

interface SyncStatusProps {
  className?: string;
}

/**
 * Sync Status Indicator
 *
 * Shows current sync state in the header:
 * - Synced (green checkmark) - No pending changes
 * - Pending (yellow with count) - Changes queued for sync
 * - Syncing (blue spinner) - Active sync in progress
 * - Offline (gray cloud) - Network unavailable
 * - Error (red x) - Sync error occurred
 *
 * Clicking triggers manual sync when online.
 */
export function SyncStatus({ className }: SyncStatusProps) {
  const [status, setStatus] = useState<SyncStatusType>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  // Update online status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setStatus('offline');
    };

    // Set initial state
    setIsOnline(navigator.onLine);
    if (!navigator.onLine) {
      setStatus('offline');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Poll for pending changes count
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkPendingChanges = async () => {
      try {
        // Dynamic import to avoid SSR issues with IndexedDB
        const { getPendingCount } = await import('@infinity-tournament/shared/sync');
        const count = await getPendingCount();
        setPendingCount(count);
      } catch {
        // IndexedDB not available or other error
        setPendingCount(0);
      }
    };

    checkPendingChanges();
    const interval = setInterval(checkPendingChanges, 2000);

    return () => clearInterval(interval);
  }, []);

  // Listen for sync engine status changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupEngineListener = async () => {
      try {
        const { getSyncEngine } = await import('@infinity-tournament/shared/sync');
        const engine = getSyncEngine();

        if (engine) {
          // Poll engine status
          const checkStatus = () => {
            const engineStatus = engine.getStatus();
            if (isOnline || engineStatus === 'offline') {
              setStatus(engineStatus);
            }
          };

          checkStatus();
          const interval = setInterval(checkStatus, 1000);
          return () => clearInterval(interval);
        }
      } catch {
        // Engine not initialized
      }
    };

    setupEngineListener();
  }, [isOnline]);

  const handleClick = useCallback(async () => {
    if (!isOnline || status === 'syncing') return;

    try {
      const { getSyncEngine } = await import('@infinity-tournament/shared/sync');
      const engine = getSyncEngine();
      if (engine) {
        setStatus('syncing');
        await engine.sync();
      }
    } catch {
      setStatus('error');
    }
  }, [isOnline, status]);

  const { label, color, description } = getStatusDisplay(status, pendingCount);

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('h-8 px-2 gap-1.5', className)}
      onClick={handleClick}
      disabled={!isOnline || status === 'syncing'}
      title={`${label} - ${description}`}
    >
      <span className={cn('h-2 w-2 rounded-full', color)} />
      {pendingCount > 0 && status !== 'syncing' && (
        <span className="text-xs text-muted-foreground">
          {pendingCount}
        </span>
      )}
      {status === 'syncing' && (
        <span className="h-3 w-3 animate-spin">
          <SyncSpinner />
        </span>
      )}
    </Button>
  );
}

function getStatusDisplay(status: SyncStatusType, pendingCount: number) {
  switch (status) {
    case 'syncing':
      return {
        label: 'Syncing...',
        color: 'bg-blue-500',
        description: 'Syncing changes with server',
      };
    case 'offline':
      return {
        label: 'Offline',
        color: 'bg-gray-400',
        description: 'Changes will sync when online',
      };
    case 'error':
      return {
        label: 'Sync Error',
        color: 'bg-red-500',
        description: 'Click to retry sync',
      };
    case 'idle':
    default:
      if (pendingCount > 0) {
        return {
          label: `${pendingCount} pending`,
          color: 'bg-yellow-500',
          description: 'Click to sync now',
        };
      }
      return {
        label: 'Synced',
        color: 'bg-green-500',
        description: 'All changes saved',
      };
  }
}

function SyncSpinner() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
