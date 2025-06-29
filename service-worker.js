// service-worker.js
const CACHE_NAME = 'calistenia-app-cache-v1';
const urlsToCache = [
  './', // Caches the root (index.html)
  './index.html',
  './manifest.json',
  // CDNs - These might be tricky to cache reliably, but we list them
  // The browser's cache for CDNs is usually very aggressive anyway
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/tone/15.1.22/Tone.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap',
  // Placeholder for the icon
  'https://placehold.co/192x192/18181b/ffffff?text=APP',
  'https://placehold.co/512x512/18181b/ffffff?text=APP'
];

// Install event: Caches all necessary assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Abriendo caché y precacheando URLs.');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Fallo al precachear:', error);
      })
  );
});

// Fetch event: Intercepts network requests and serves from cache if available
self.addEventListener('fetch', (event) => {
  // We only cache GET requests
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Cache hit - return response
          if (response) {
            return response;
          }
          // No cache hit - fetch from network
          return fetch(event.request)
            .then(networkResponse => {
              // Cache new requests
              return caches.open(CACHE_NAME).then(cache => {
                // Only cache valid responses, not errors
                if (networkResponse.ok) {
                  cache.put(event.request, networkResponse.clone());
                }
                return networkResponse;
              });
            })
            .catch(error => {
              console.error('Service Worker: Fallo en fetch:', error);
              // You could return a custom offline page here
            });
        })
    );
  }
});

// Activate event: Cleans up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
});

// Notification click event (for when the user clicks a notification)
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Close the notification

  // If the user clicks the notification, open the app
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus(); // Focus existing window
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./index.html'); // Open new window
      }
      return null;
    })
  );
});

// Push event (for receiving actual push notifications from a server)
// This part requires a backend server to send push messages
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Calistenia App';
  const options = {
    body: data.body || 'Tu entrenamiento continua!',
    icon: 'https://placehold.co/192x192/18181b/ffffff?text=APP',
    badge: 'https://placehold.co/48x48/18181b/ffffff?text=APP', // Small icon for some platforms
    tag: 'workout-notification', // Groups notifications
    renotify: true // Re-displays a new notification if one with the same tag exists
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});
