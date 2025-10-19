// sw.js — VisiCalc Tribute (offline cache) — v2.6b3
const CACHE = 'visicalc-v2.6b3';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll([
      './',
      './index.html?v=2.6b3',
      './app.v2.6.js?v=2.6b3',
      './mobile.css?v=2.6b3',
      './mobile-ui.js?v=2.6b3',
      './index_splash_mobile_patch.js?v=2.6b3',
      './readme.html',
      './formulas_guide.html',
      './visicalc_timeline.html',
      './manifest.webmanifest?v=2.6b3'
    ])).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
