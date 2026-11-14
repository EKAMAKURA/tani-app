// sw.js — iPad・iPhone 用（PWA）のサービスワーカー。設計 §13.23、D-020
// 同じ場所のアプリのファイルだけをキャッシュし、ネットが無くても開けるようにする。外のアドレスには触れない。
// CACHE と FILES は build.mjs が差し込む。CACHE には中身のハッシュが入るので、新しい版を公開するとこのファイルが変わる。
const CACHE = "tani-v5-a4cff436d517";
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

// 画面の読み込み（navigate）はネットを先に見る。取れたらキャッシュを新しくする。3秒で取れない・つながらないときはキャッシュ（D-024）
const NAV_TIMEOUT_MS = 3000;
function fromNetwork(req, c) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), NAV_TIMEOUT_MS);
    // navigate の Request にオプションを付けると例外になるので、アドレスで取り直す
    fetch(req.url, { cache: 'no-store', credentials: 'same-origin' }).then((res) => {
      clearTimeout(timer);
      if (!res.ok) return reject(new Error('status ' + res.status));
      c.put('index.html', res.clone()).catch(() => {});
      resolve(res);
    }, (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then((c) => fromNetwork(req, c)
      .catch(() => c.match('index.html').then((hit) => hit || c.match(req, { ignoreSearch: true })).then((hit) => hit || fetch(req)))));
    return;
  }
  event.respondWith(caches.open(CACHE).then((c) => c.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req))));
});
