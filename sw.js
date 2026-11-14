// 離線快取：網頁檔一律先抓網路上的新版（改版馬上看得到），沒網路才用存在平板上的。
// 字型檔不會變，存過就直接用。進度送到試算表的請求不經過這裡。
const CACHE = 'yb-v2';
const CORE = ['./', 'index.html', 'config.js', 'words.js', 'stories.enc.json', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  const fontFile = url.hostname === 'fonts.gstatic.com', fontCss = url.hostname === 'fonts.googleapis.com';
  if (url.origin !== location.origin && !fontFile && !fontCss) return;
  const put = res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  };
  if (fontFile) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(put)));
    return;
  }
  e.respondWith(fetch(req).then(put).catch(() => caches.match(req, { ignoreSearch: true })
    .then(hit => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
