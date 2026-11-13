// sw.js — iPad・iPhone 用（PWA）のサービスワーカー。設計 §13.23、D-020
// 同じ場所のアプリのファイルだけをキャッシュし、ネットが無くても開けるようにする。外のアドレスには触れない。
// CACHE と FILES は build.mjs が差し込む。CACHE には中身のハッシュが入るので、新しい版を公開するとこのファイルが変わる。
const CACHE = "tani-v5-0eedf1ee314c";
const FILES = ["./","index.html","manifest.webmanifest","icon-180.png","icon-192.png","icon-512.png"];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(caches.open(CACHE).then((c) => c.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req))));
});
