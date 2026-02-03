/// <reference lib="webworker" />

const CACHE_NAME = 'archflow-cache-v3';
const STATIC_CACHE_NAME = 'archflow-static-v1';
const OFFLINE_URL = '/offline.html';

// Resources to pre-cache
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
];

// Static assets that change rarely (cache first strategy)
const STATIC_EXTENSIONS = ['.woff', '.woff2', '.ttf', '.eot', '.ico', '.png', '.jpg', '.jpeg', '.svg', '.webp'];

// Check if URL is a static asset
function isStaticAsset(url) {
  return STATIC_EXTENSIONS.some(ext => url.toLowerCase().endsWith(ext));
}

// Check if URL is a JS/CSS chunk (immutable with hash)
function isImmutableChunk(url) {
  return /\/assets\/[^\/]+\.[a-f0-9]{8}\.(js|css)$/.test(url);
}

// Install event - precache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Cache all precache URLs
      await cache.addAll(PRECACHE_URLS);
      // Skip waiting to activate immediately
      await self.skipWaiting();
    })()
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Delete old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
      // Take control of all clients
      await self.clients.claim();
    })()
  );
});

// Message event - handle skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event - different strategies based on resource type
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip Supabase API requests (always network)
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  const url = event.request.url;

  // Cache-first for immutable chunks (JS/CSS with hash)
  if (isImmutableChunk(url)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE_NAME));
    return;
  }

  // Cache-first for static assets (fonts, images)
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE_NAME));
    return;
  }

  // Network-first for everything else (HTML, API-like requests)
  event.respondWith(networkFirst(event.request, CACHE_NAME));
});

// Cache-first strategy (best for static assets)
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Resource not available offline', { status: 503 });
  }
}

// Network-first strategy (best for dynamic content)
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // For navigation requests, show offline page
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match(OFFLINE_URL);
      if (offlineResponse) {
        return offlineResponse;
      }
    }

    return new Response('אין חיבור לאינטרנט', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  const options = event.data?.json() || {
    title: 'ArchFlow',
    body: 'יש לך התראה חדשה',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    dir: 'rtl',
    lang: 'he',
  };

  event.waitUntil(
    self.registration.showNotification(options.title, {
      body: options.body,
      icon: options.icon || '/icons/icon-192x192.png',
      badge: options.badge || '/icons/icon-72x72.png',
      dir: 'rtl',
      lang: 'he',
      tag: options.tag || 'archflow-notification',
      data: options.data,
      actions: options.actions,
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window' });
      
      // Check if app is already open
      for (const client of clients) {
        if (client.url.includes(self.location.origin)) {
          await client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: urlToOpen,
          });
          return;
        }
      }
      
      // Open new window
      await self.clients.openWindow(urlToOpen);
    })()
  );
});

// Background sync handler
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  // Get pending offline data from IndexedDB and sync to server
  // This is a placeholder - implement based on your needs
  console.log('Background sync: syncing offline data');
}

// Message handler
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker loaded - ArchFlow PWA');
