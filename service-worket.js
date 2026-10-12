// ============================================================
//  Service Worker - Cihaz Test PWA
// ============================================================
const CACHE_VERSION = 'cihaz-test-v2.0.0';
const CACHE_NAME = CACHE_VERSION;

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// ---------- INSTALL ----------
self.addEventListener('install', (event) => {
  console.log('🔧 SW: install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch(err => console.error('Precache hatası:', err))
  );
});

// ---------- ACTIVATE ----------
self.addEventListener('activate', (event) => {
  console.log('✅ SW: activate');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ---------- FETCH ----------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Sadece GET isteklerini ele al
  if (req.method !== 'GET') return;

  // Hız/ping testleri cache'lenmesin
  if (url.hostname.includes('speed.cloudflare.com')) return;

  // Farklı origin'ler için network-first
  if (url.origin !== self.location.origin) return;

  // Same-origin: cache-first, arkada network güncellemesi
  event.respondWith(
    caches.match(req).then(cached => {
      const networkFetch = fetch(req)
        .then(res => {
          if (res && res.status === 200 && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          // Offline fallback (navigation isteği ise index.html)
          if (req.mode === 'navigate') return caches.match('./index.html');
          return cached;
        });

      return cached || networkFetch;
    })
  );
});

// ---------- MESSAGE (manuel güncelleme) ----------
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});