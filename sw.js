/* LE CHAUDRON — sw.js
   Fait marcher l'app hors ligne. Le nom du cache suit le numéro
   de version.js : à chaque nouvelle version, l'ancien cache est jeté. */
importScripts('version.js');
const CACHE = 'chaudron-' + VERSION.numero;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys()
    .then(noms => Promise.all(noms.filter(n => n.startsWith('chaudron-') && n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim())
));

// Réseau d'abord (en redemandant toujours au serveur s'il y a plus récent),
// mémoire seulement si on est hors ligne.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(r => {
      if (r.ok) { const copie = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copie)).catch(() => {}); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
