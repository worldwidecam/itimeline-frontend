// iTimeline Service Worker (Network-first pass-through for PWA & Google Play TWA installability)
// Intentionally avoids caching stale HTML/JS chunks while satisfying Chrome/PWABuilder install criteria.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Pass all requests straight through to the network so live updates are never blocked by stale cache
  event.respondWith(fetch(event.request));
});

