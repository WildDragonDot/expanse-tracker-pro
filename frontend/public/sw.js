const CACHE_NAME = 'expense-tracker-v2'
const urlsToCache = [
  '/',
  '/login',
  '/register',
  '/manifest.json',
  '/offline.html'
]

// Offline fallback page
const OFFLINE_PAGE = '/offline.html'

// Install event - only cache public assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files')
        return cache.addAll(urlsToCache).catch((error) => {
          console.error('Service Worker: Cache addAll failed:', error)
          // Don't fail installation if caching fails
          return Promise.resolve()
        })
      })
      .then(() => {
        console.log('Service Worker: Installed')
        return self.skipWaiting()
      })
  )
})

// Fetch event - Network first, then cache
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return
  }

  const url = new URL(event.request.url)

  // Leave cross-origin requests alone. This avoids CSP noise and lets the
  // browser handle requests we are not responsible for.
  if (url.origin !== self.location.origin) {
    return
  }

  // Skip caching for API requests - but provide offline fallback
  if (event.request.url.includes('/api/')) {
    return event.respondWith(
      fetch(event.request).catch(() => {
        // Return a basic offline response for API calls
        return new Response(
          JSON.stringify({ error: 'Offline', message: 'No internet connection' }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
          }
        )
      })
    )
  }

  // For navigation requests (page loads)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful page responses
          if (response.status === 200) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return response
        })
        .catch(() => {
          // If network fails for navigation, try cache first, then offline page
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse
              }
              // Return offline page for navigation requests
              return caches.match(OFFLINE_PAGE)
            })
        })
    )
    return
  }

  // For other requests (assets, etc.)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseToCache = response.clone()
        
        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        
        return response
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request)
      })
  )
})

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
    .then(() => {
      console.log('Service Worker: Activated')
      return self.clients.claim()
    })
  )
})

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
