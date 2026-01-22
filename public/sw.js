// Service Worker for Feedgod
const CACHE_NAME = 'feedgod-v1'

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/solana.png',
  '/ethereum.png',
  '/monad.png',
]

// Cache static assets on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Clean up old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )
  self.clients.claim()
})

// Network-first strategy with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip API requests - let them fail gracefully
  if (request.url.includes('/api/')) return

  // Skip external requests
  if (!request.url.startsWith(self.location.origin)) return

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone the response before caching
        const responseToCache = response.clone()

        // Cache successful responses
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })
        }

        return response
      })
      .catch(async () => {
        // Return cached response on network failure
        const cachedResponse = await caches.match(request)
        if (cachedResponse) {
          return cachedResponse
        }

        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/')
        }

        // Return a basic offline response for other requests
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable',
        })
      })
  )
})

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting()
  }
})
