/**
 * Service Worker for Infinity Tournament Manager
 *
 * Handles:
 * - Offline caching of static assets
 * - Background sync for pending changes
 * - Network status notifications
 */

const CACHE_NAME = 'infinity-tournament-v1';
const STATIC_CACHE_NAME = 'infinity-tournament-static-v1';

// Static assets to cache for offline access
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
];

// API routes that should NOT be cached
const NO_CACHE_PATTERNS = [
  /\/api\//,
  /supabase\.co/,
  /\.supabase\.co/,
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );

  // Take over immediately
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name.startsWith('infinity-tournament-') &&
              name !== CACHE_NAME &&
              name !== STATIC_CACHE_NAME
            );
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );

  // Claim all clients immediately
  self.clients.claim();
});

/**
 * Fetch event - network first with cache fallback
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API and Supabase requests
  if (NO_CACHE_PATTERNS.some((pattern) => pattern.test(url.href))) {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(
    // Try network first
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(async () => {
        // Network failed, try cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If it's a navigation request, return offline page
        if (request.mode === 'navigate') {
          const offlinePage = await caches.match('/offline');
          if (offlinePage) {
            return offlinePage;
          }
        }

        // Return a simple offline response
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' },
        });
      })
  );
});

/**
 * Background Sync event - sync pending changes when online
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);

  if (event.tag === 'sync-changes') {
    event.waitUntil(syncPendingChanges());
  }
});

/**
 * Sync pending changes to server
 */
async function syncPendingChanges() {
  console.log('[SW] Syncing pending changes...');

  try {
    // Notify all clients to trigger sync
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_REQUESTED',
        timestamp: Date.now(),
      });
    });

    console.log('[SW] Sync request sent to clients');
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error; // Will retry
  }
}

/**
 * Message event - handle messages from clients
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      event.ports[0]?.postMessage({ version: CACHE_NAME });
      break;

    case 'CLEAR_CACHE':
      caches.keys().then((names) => {
        Promise.all(names.map((name) => caches.delete(name)));
      });
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

/**
 * Push notification event (for future use)
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body || 'New notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Tournament Update', options)
  );
});

/**
 * Notification click event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Check if there's already a window open
      for (const client of clients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

console.log('[SW] Service worker loaded');
