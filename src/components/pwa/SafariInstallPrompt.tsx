'use client';

import { useEffect } from 'react';
import { X, Share, Plus } from 'lucide-react';
import { usePWAStatus } from '@/hooks/use-pwa-status';

/**
 * Safari PWA Install Prompt
 *
 * Displays a non-intrusive banner prompting Safari/iOS users to install
 * the PWA to prevent 7-day IndexedDB eviction.
 *
 * Shows only when:
 * - User is on Safari/iOS
 * - App is not already installed as PWA
 * - User has visited 2+ times
 * - User hasn't dismissed in the last 30 days
 */
export function SafariInstallPrompt() {
  const { shouldShowPrompt, dismissPrompt, recordVisit } = usePWAStatus();

  // Record visit on mount
  useEffect(() => {
    recordVisit();
  }, [recordVisit]);

  if (!shouldShowPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe">
      <div className="mx-auto max-w-lg rounded-lg border border-border bg-background shadow-lg">
        <div className="flex items-start gap-3 p-4">
          {/* App icon area */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <span className="text-2xl">♾️</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">
              Install Infinity Tournament Manager
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Add to your home screen for the best experience and to keep your offline data safe.
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={dismissPrompt}
            className="shrink-0 rounded-md p-1 hover:bg-accent transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Instructions */}
        <div className="border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground mb-2">
            To install:
          </p>
          <ol className="text-xs text-muted-foreground space-y-1.5">
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-medium">
                1
              </span>
              <span className="flex items-center gap-1">
                Tap the Share button
                <Share className="h-3.5 w-3.5 inline-block" />
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-medium">
                2
              </span>
              <span className="flex items-center gap-1">
                Scroll and tap &quot;Add to Home Screen&quot;
                <Plus className="h-3.5 w-3.5 inline-block" />
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-medium">
                3
              </span>
              <span>Tap &quot;Add&quot; in the top right</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default SafariInstallPrompt;
