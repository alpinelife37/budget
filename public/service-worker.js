const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "styles.css",
  "/index.js",
  "/db.js",
  "/manifest.json",
  "/icons/icon-144x127.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

const CACHE_NAME = "static-cache-v1";
const RUNTIME_CACHE = "runtime-cache";

// install
self.addEventListener("install", function(evt) {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Your files were pre-cached successfully!");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

//activate
self.addEventListener("activate", evt => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  evt.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return cacheNames.filter(
          cacheName => !currentCaches.includes(cacheName)
        );
      })
      .then(cachesToDelete => {
        return Promise.all(
          cachesToDelete.map(cacheToDelete => {
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", evt => {
  if (
    evt.request.method !== "GET" ||
    !evt.request.url.startsWith(self.location.origin)
  ) {
    evt.respondWith(fetch(evt.request));
    return;
  }
  if (evt.request.url.includes("/api/transaction")) {
    evt.respondWith(
      caches.open(RUNTIME_CACHE).then(cache => {
        return fetch(evt.request)
          .then(response => {
            cache.put(evt.request, response.clone());
            return response;
          })
          .catch(() => caches.match(evt.request));
      })
    );
    return;
  }
  evt.respondWith(
    caches.match(evt.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return caches.open(RUNTIME_CACHE).then(cache => {
        return fetch(evt.request).then(response => {
          return cache.put(evt.request, response.clone()).then(() => {
            return response;
          });
        });
      });
    })
  );
});
