// KuryeTakip service worker — gives the web app installability + a basic
// offline shell. Network-first for same-origin GETs; API/cross-origin requests
// pass straight through so data and auth are never served stale.
const CACHE = 'kuryetakip-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let API / cross-origin through

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then((m) => m || (req.mode === 'navigate' ? caches.match('/') : undefined))
      )
  );
});
