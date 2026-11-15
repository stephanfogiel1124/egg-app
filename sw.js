// Egg service worker v0.3 — app shell: serve from cache instantly, refresh in the background.
// Always fetch shell files with cache:'no-cache' so the browser's HTTP cache (GitHub Pages max-age=600) can't hand back
// an old page. Data files (data/*.bin) are cached by the page itself (Cache API, "egg-data-v1"), not here.
const SHELL = 'egg-shell-v3';
const FILES = ['index.html', 'manifest.json', 'icon.svg', 'icon-180.png'];
const fresh = f => fetch(new Request(f, { cache: 'no-cache' }));
self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => Promise.all(FILES.map(f => fresh(f).then(r => { if (r.ok) return c.put(f, r); })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('egg-shell-') && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.includes('/data/') || u.pathname.endsWith('/sw.js')) return;
  const key = e.request.mode === 'navigate' ? 'index.html' : u.pathname.split('/').pop() || 'index.html';
  e.respondWith(caches.open(SHELL).then(async c => {
    const hit = await c.match(key);
    const net = fresh(key).then(r => { if (r.ok) c.put(key, r.clone()); return r; });
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net;
  }));
});
