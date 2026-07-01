// Service worker cho PWA quán cà phê.
// Tăng số version mỗi lần đổi cách cache để làm mới.
const CACHE = 'cafe-shell-v1';
const SHELL = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

// Cài đặt: nạp sẵn khung ứng dụng
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

// Kích hoạt: xóa cache cũ
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Lấy tài nguyên
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Không cache API và request khác GET (luôn dùng mạng để dữ liệu mới nhất)
  if (req.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return; // để trình duyệt xử lý bình thường
  }

  // Tài nguyên tĩnh: trả cache ngay, đồng thời cập nhật ngầm (stale-while-revalidate)
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
