// Service Worker for Parkimi Velipojë PWA
const CACHE_NAME = 'parkimi-v2'
const MAP_CACHE_NAME = 'parkimi-maps-v1'

// App shell assets to cache on install
const APP_SHELL = [
  '/',
  '/zones',
  '/login',
  '/manifest.json',
]

// Map images to cache
const MAP_IMAGES = [
  '/maps/zona-1.jpg',
  '/maps/zona-2.jpg',
  '/maps/zona-3.jpg',
  '/maps/zona-4.jpg',
]

// Install: cache app shell and map images
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) =>
        cache.addAll(APP_SHELL).catch(() => {/* Non-fatal */})
      ),
      caches.open(MAP_CACHE_NAME).then((cache) =>
        cache.addAll(MAP_IMAGES).catch(() => {/* Non-fatal */})
      ),
    ]).then(() => self.skipWaiting())
  )
})

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== MAP_CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

// Fetch: network-first for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip non-GET and cross-origin requests
  if (event.request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  // Supabase API calls — always network only (no offline mutations)
  if (url.pathname.startsWith('/rest/') || url.pathname.startsWith('/auth/')) return

  // Map images — cache first, then network
  if (url.pathname.startsWith('/maps/')) {
    event.respondWith(
      caches.open(MAP_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request)
        if (cached) return cached
        try {
          const response = await fetch(event.request)
          if (response.ok) cache.put(event.request, response.clone())
          return response
        } catch {
          return new Response('', { status: 503 })
        }
      })
    )
    return
  }

  // Static assets (_next/static) — cache first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const response = await fetch(event.request)
          if (response.ok) cache.put(event.request, response.clone())
          return response
        } catch {
          const cached = await cache.match(event.request)
          return cached ?? new Response('', { status: 503 })
        }
      })
    )
    return
  }

  // All other requests — network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone())
          })
        }
        return response
      })
      .catch(async () => {
        const cached = await caches.match(event.request)
        return cached ?? new Response('Offline', { status: 503 })
      })
  )
})
