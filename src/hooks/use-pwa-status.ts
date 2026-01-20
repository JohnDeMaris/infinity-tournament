'use client';

import { useState, useEffect, useCallback } from 'react';

const VISIT_COUNT_KEY = 'itm-pwa-visits';
const DISMISSED_KEY = 'itm-pwa-dismissed';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface PWAStatus {
  /** Whether the device is iOS */
  isIOS: boolean;
  /** Whether the browser is Safari */
  isSafari: boolean;
  /** Whether running in standalone PWA mode */
  isStandalone: boolean;
  /** Whether we should show the install prompt */
  shouldShowPrompt: boolean;
  /** Number of visits */
  visitCount: number;
  /** Dismiss the prompt for 30 days */
  dismissPrompt: () => void;
  /** Increment visit count */
  recordVisit: () => void;
}

/**
 * Hook to detect PWA status and manage Safari install prompt
 *
 * Safari evicts IndexedDB data after 7 days for non-PWA websites.
 * This hook helps prompt users to install the PWA to prevent data loss.
 */
export function usePWAStatus(): PWAStatus {
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [visitCount, setVisitCount] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  // Detect platform and browser on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);

    // Detect Safari (not Chrome, Edge, etc. on iOS)
    const safari = /Safari/.test(navigator.userAgent) &&
      !/Chrome/.test(navigator.userAgent) &&
      !/CriOS/.test(navigator.userAgent) &&
      !/FxiOS/.test(navigator.userAgent) &&
      !/EdgiOS/.test(navigator.userAgent);
    setIsSafari(safari);

    // Detect standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    // Get visit count
    const storedVisits = localStorage.getItem(VISIT_COUNT_KEY);
    const visits = storedVisits ? parseInt(storedVisits, 10) : 0;
    setVisitCount(visits);

    // Check if dismissed
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const now = Date.now();
      if (now - dismissedTime < THIRTY_DAYS_MS) {
        setIsDismissed(true);
      } else {
        // Expired, remove the key
        localStorage.removeItem(DISMISSED_KEY);
      }
    }
  }, []);

  // Record a visit
  const recordVisit = useCallback(() => {
    if (typeof window === 'undefined') return;

    const newCount = visitCount + 1;
    localStorage.setItem(VISIT_COUNT_KEY, newCount.toString());
    setVisitCount(newCount);
  }, [visitCount]);

  // Dismiss the prompt
  const dismissPrompt = useCallback(() => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
    setIsDismissed(true);
  }, []);

  // Determine if we should show the prompt
  const shouldShowPrompt =
    isIOS &&
    isSafari &&
    !isStandalone &&
    visitCount >= 2 &&
    !isDismissed;

  return {
    isIOS,
    isSafari,
    isStandalone,
    shouldShowPrompt,
    visitCount,
    dismissPrompt,
    recordVisit,
  };
}

export default usePWAStatus;
