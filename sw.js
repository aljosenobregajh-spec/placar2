/* Placar — service worker: deixa o site abrir sem internet depois da primeira visita.
   Páginas, estilos e scripts: rede primeiro (pega as atualizações), cópia salva se estiver offline.
   Escudos e fontes: cópia salva primeiro (quase nunca mudam). */
const VERSION = 'placar-v1';
const CORE = ['./', 'index.html', 'assets/css/style.css', 'assets/js/data.js', 'assets/js/engine.js', 'assets/js/reg.js', 'assets/js/templates.js', 'assets/js/app.js', 'manifest.webmanifest', 'assets/icons/icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isAsset = url.pathname.includes('/assets/logos/') || url.pathname.includes('/assets/icons/') || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (isAsset) {
    e.respondWith(caches.open(VERSION).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith(fetch(req).then(res => {
    if (res.ok) caches.open(VERSION).then(c => c.put(req, res.clone()));
    return res;
  }).catch(() => caches.match(req).then(hit => hit || caches.match('index.html'))));
});
