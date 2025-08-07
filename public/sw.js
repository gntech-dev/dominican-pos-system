// Service Worker for PWA functionality
const CACHE_NAME = 'pos-dominican-v1.0'
const urlsToCache = [
  '/',
  '/sales/new',
  '/finance',
  '/products',
  '/customers',
  '/manifest.json',
  // Add critical CSS and JS files
  '/_next/static/css/app/layout.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main.js'
]

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
      .catch(() => {
        // If both cache and network fail, show offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/offline')
        }
      })
  )
})

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Background sync for offline sales
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-sales') {
    event.waitUntil(syncOfflineSales())
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación del POS',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Detalles',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/xmark.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('POS Dominican Republic', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Sync offline sales when connection is restored
async function syncOfflineSales() {
  try {
    const cache = await caches.open(CACHE_NAME)
    const offlineSales = await cache.match('/offline-sales')
    
    if (offlineSales) {
      const salesData = await offlineSales.json()
      
      // Send offline sales to server
      const response = await fetch('/api/sales/sync-offline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salesData)
      })

      if (response.ok) {
        // Clear offline sales cache after successful sync
        await cache.delete('/offline-sales')
        console.log('Offline sales synced successfully')
      }
    }
  } catch (error) {
    console.error('Error syncing offline sales:', error)
  }
}
