// Solifon AI Service Worker v3.0 — GitHub Pages Fix
const CACHE_NAME = 'solifon-ai-v3';

// Для GitHub Pages путь начинается с /Solifon-ai/
const BASE = '/Solifon-ai';

const ASSETS_TO_CACHE = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/style.css',
  BASE + '/script.js',
  BASE + '/offline-download.html',
  BASE + '/manifest.json',
  // Внешние шрифты и иконки
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
];

// Установка
self.addEventListener('install', (event) => {
  console.log('SW: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Caching files...');
      return Promise.allSettled(
        ASSETS_TO_CACHE.map(url => 
          cache.add(url).catch(err => console.warn('SW: Failed to cache:', url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

// Активация
self.addEventListener('activate', (event) => {
  console.log('SW: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('SW: Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Пропускаем API запросы
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('firebaseapp.com') ||
    url.hostname.includes('googleapis.com') ||
    url.pathname.includes('/api/') ||
    url.pathname.includes('/v1/') ||
    url.hostname.includes('huggingface.co')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) {
            console.log('SW: Serving from cache:', event.request.url);
            return cached;
          }
          // Fallback на главную
          return caches.match(BASE + '/index.html') || 
                 caches.match(BASE + '/');
        });
      })
  );
});
