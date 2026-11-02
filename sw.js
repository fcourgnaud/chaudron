// Service worker "réseau d'abord" : l'app prend toujours tes dernières modifs
// si tu as internet, et marche hors ligne avec la dernière version vue.
const CACHE = 'chaudron-v2';
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copie = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copie)).catch(() => {});
      return r;
    }).catch(() => caches.match(e.request))
  );
});
