const CACHE_NAME = 'hindi-app-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Устанавливаем Service Worker и кэшируем основные файлы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кэшируем файлы для офлайн-работы');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Активируем новый Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Удаляем старый кэш:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Обрабатываем запросы
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Возвращаем кэшированную версию, если она есть
        if (response) {
          return response;
        }

        // Иначе загружаем из сети
        return fetch(event.request)
          .then(response => {
            // Проверяем, валидный ли ответ
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Клонируем ответ
            const responseToCache = response.clone();

            // Кэшируем новый ресурс
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Если нет сети и нет в кэше, можно показать заглушку
            if (event.request.url.includes('index.html')) {
              return caches.match('./');
            }
            return new Response('Нет подключения к интернету');
          });
      })
  );
});

// Обработка сообщений от основного потока
self.addEventListener('message', event => {
  if (event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME);
  }
});
