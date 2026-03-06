/**
 * Propertech PWA Service Worker
 * Cache-first for static assets, network-first for API calls.
 * Supports offline inspection capture and background sync.
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `propertech-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `propertech-runtime-${CACHE_VERSION}`;

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/inspect',
  '/favicon.png',
  '/logo.svg',
  '/site.webmanifest',
];

// ====================================================
// INSTALL: pre-cache static shell
// ====================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Non-fatal — individual failures silently skipped
      });
    }).then(() => self.skipWaiting())
  );
});

// ====================================================
// ACTIVATE: clean up old caches
// ====================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// ====================================================
// FETCH: routing strategy
// ====================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // API requests → network-first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Next.js internals → network only
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets → cache-first
  if (
    url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff2?|css|js)$/)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // App pages (inspect/*) → stale-while-revalidate for offline support
  if (url.pathname.startsWith('/inspect')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Default: network-first
  event.respondWith(networkFirst(request));
});

// ====================================================
// STRATEGIES
// ====================================================

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const networkPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cached);

  return cached || networkPromise;
}

// ====================================================
// BACKGROUND SYNC (experimental)
// ====================================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-inspections') {
    event.waitUntil(
      // Notify all clients to trigger sync
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'TRIGGER_SYNC' });
        });
      })
    );
  }
});

// ====================================================
// MESSAGES from client
// ====================================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
