// Service Worker — يعمل التطبيق بدون إنترنت، ويجلب أحدث نسخة عند توفر الاتصال
const CACHE = 'school-app-v2.3.0';
const ASSETS = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    const req = e.request;
    if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
    // الصفحة الرئيسية: الشبكة أولاً (لتصل التحديثات من GitHub)، ثم النسخة المخزنة عند انقطاع الإنترنت
    if (req.mode === 'navigate' || req.url.endsWith('/index.html')) {
        e.respondWith(
            fetch(req).then((res) => {
                const copy = res.clone();
                caches.open(CACHE).then((c) => c.put('./index.html', copy));
                return res;
            }).catch(() => caches.match('./index.html'))
        );
        return;
    }
    // باقي الملفات: من المخزن أولاً
    e.respondWith(
        caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
        }))
    );
});
