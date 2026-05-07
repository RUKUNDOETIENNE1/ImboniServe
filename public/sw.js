// Imboni Serve - Service Worker for Offline PWA
const CACHE_NAME = 'imboni-serve-v2'
const RUNTIME_CACHE = 'imboni-serve-runtime-v2'
const IMAGE_CACHE = 'imboni-serve-images-v2'

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/sales',
  '/dashboard/sales/new',
  '/dashboard/inventory',
  '/dashboard/reports',
  '/dashboard/transactions',
  '/dashboard/settings',
  '/dashboard/support/inbox',
  '/offline.html',
  '/manifest.json',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
})

// Message event - handle skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE && name !== IMAGE_CACHE)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch event - network-first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // API requests - network-first, no cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline - request queued' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      })
    )
    return
  }

  // Next.js build assets - stale-while-revalidate
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/_next/image')) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone())
            }
            return response
          })
          return cachedResponse || fetchPromise
        })
      })
    )
    return
  }

  // Images - cache-first with long-term storage
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          return fetch(request).then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone())
            }
            return response
          }).catch(() => {
            return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#f0f0f0"/></svg>', {
              headers: { 'Content-Type': 'image/svg+xml' }
            })
          })
        })
      })
    )
    return
  }

  // Static assets - cache-first
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response
        }

        const responseToCache = response.clone()
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache)
        })

        return response
      }).catch(() => {
        // Offline fallback page
        if (request.mode === 'navigate') {
          return caches.match('/offline.html')
        }
      })
    })
  )
})

// Background sync for outbox
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-outbox') {
    event.waitUntil(syncOutbox())
  }
})

async function syncOutbox() {
  // This will be called by the outbox service
  const registration = self.registration
  const clients = await registration.clients.matchAll()
  
  clients.forEach((client) => {
    client.postMessage({
      type: 'SYNC_OUTBOX',
      timestamp: Date.now(),
    })
  })
}
