'use client';

/**
 * PWA Install Detection Hook
 *
 * Re-exports usePWAStatus for backwards compatibility
 * and clearer naming in install prompt context.
 */
export { usePWAStatus as usePWAInstall, usePWAStatus } from './use-pwa-status';
export { default } from './use-pwa-status';
