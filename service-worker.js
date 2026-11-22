/* Mes comptes — service worker hors ligne.
   Pour publier une mise à jour : changer VERSION ci-dessous. */
const VERSION = 'v3';
const CACHE = 'mes-comptes-' + VERSION;
const FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'icon-167.png', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('mes-comptes-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Cache d'abord (instantané, marche sans réseau) ; si le fichier n'est pas en cache on tente le réseau.
   Toute navigation retombe sur index.html. Les mises à jour arrivent via un nouveau VERSION. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    } catch (err) {
      if (req.mode === 'navigate') return (await cache.match('index.html')) || (await cache.match('./'));
      return new Response('', { status: 504, statusText: 'Hors ligne' });
    }
  })());
});
