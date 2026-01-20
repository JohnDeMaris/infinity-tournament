/**
 * Service Worker Registration Helper
 *
 * Registers the service worker and provides utilities for
 * background sync and notifications.
 */

export interface ServiceWorkerStatus {
  supported: boolean;
  registered: boolean;
  controller: ServiceWorker | null;
  registration: ServiceWorkerRegistration | null;
}

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerStatus> {
  const status: ServiceWorkerStatus = {
    supported: false,
    registered: false,
    controller: null,
    registration: null,
  };

  // Check if service workers are supported
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported');
    return status;
  }

  status.supported = true;

  try {
    // Register the service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    swRegistration = registration;
    status.registered = true;
    status.registration = registration;
    status.controller = navigator.serviceWorker.controller;

    console.log('[SW] Service worker registered:', registration.scope);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // New version available
            console.log('[SW] New version available');
            dispatchUpdateEvent();
          }
        });
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', handleSWMessage);

    return status;
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return status;
  }
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!swRegistration) {
    return false;
  }

  try {
    const result = await swRegistration.unregister();
    swRegistration = null;
    return result;
  } catch (error) {
    console.error('[SW] Unregistration failed:', error);
    return false;
  }
}

/**
 * Request background sync
 */
export async function requestBackgroundSync(tag = 'sync-changes'): Promise<boolean> {
  if (!swRegistration || !('sync' in swRegistration)) {
    console.log('[SW] Background sync not supported');
    return false;
  }

  try {
    await (swRegistration as ServiceWorkerRegistration & {
      sync: { register: (tag: string) => Promise<void> };
    }).sync.register(tag);
    console.log('[SW] Background sync registered:', tag);
    return true;
  } catch (error) {
    console.error('[SW] Background sync registration failed:', error);
    return false;
  }
}

/**
 * Check if we're online
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return true; // Assume online for SSR
  }
  return navigator.onLine;
}

/**
 * Subscribe to online/offline events
 */
export function subscribeToNetworkStatus(
  callback: (online: boolean) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Handle messages from service worker
 */
function handleSWMessage(event: MessageEvent): void {
  const { type, timestamp } = event.data || {};

  switch (type) {
    case 'SYNC_REQUESTED':
      console.log('[SW] Sync requested at:', new Date(timestamp));
      // Dispatch custom event for app to handle
      window.dispatchEvent(
        new CustomEvent('sw-sync-requested', { detail: { timestamp } })
      );
      break;

    default:
      console.log('[SW] Unknown message:', type);
  }
}

/**
 * Dispatch update available event
 */
function dispatchUpdateEvent(): void {
  window.dispatchEvent(new CustomEvent('sw-update-available'));
}

/**
 * Skip waiting and activate new service worker
 */
export function skipWaiting(): void {
  if (swRegistration?.waiting) {
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

/**
 * Get service worker version
 */
export async function getServiceWorkerVersion(): Promise<string | null> {
  if (!navigator.serviceWorker.controller) {
    return null;
  }

  return new Promise((resolve) => {
    if (!navigator.serviceWorker.controller) {
      resolve(null);
      return;
    }

    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      resolve(event.data?.version || null);
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_VERSION' },
      [channel.port2]
    );

    // Timeout after 1 second
    setTimeout(() => resolve(null), 1000);
  });
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
  }

  // Also clear from main thread
  if ('caches' in window) {
    const names = await caches.keys();
    await Promise.all(names.map((name) => caches.delete(name)));
  }
}
