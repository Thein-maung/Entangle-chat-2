const CACHE = 'entangle-v2';
const FILES = [
  '/', '/index.html', '/chat.html', '/voice.html', '/style.css',
  '/app.js', '/chat.js', '/voice.js', '/qr.js', '/crypto.js', '/twinnet.js',
  '/manifest.json', '/icons/192.png', '/icons/512.png'
];

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE && caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('/index.html'))));
});