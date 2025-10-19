// sw.js — very simple offline cache
const CACHE = 'visicalc-v2.6';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([
    './','./index.html','./app.v2.5.js','./styles.css',
    './mobile.css','./mobile-ui.js','./index_splash_mobile_patch.js',
    './readme.html','./formulas_guide.html','./visicalc_timeline.html',
    './manifest.webmanifest'
  ])));
});
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});