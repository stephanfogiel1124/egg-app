// Egg service worker v0.1 — app shell: serve from cache instantly, refresh in the background.
// Data files (data/*.bin) are cached by the page itself (Cache API, "egg-data-v1"), not here.
const SHELL = 'egg-shell-v1';
const FILES = ['./', 'index.html', 'manifest.json', 'icon.svg', 'icon-180.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.includes('/data/')) return;
  e.respondWith(caches.open(SHELL).then(async c => {
    const key = e.request.mode === 'navigate' ? 'index.html' : e.request;
    const hit = await c.match(key, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r.ok) c.put(key, r.clone()); return r; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net;
  }));
});
