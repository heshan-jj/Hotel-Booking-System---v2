// Hotel PMS Service Worker
const CACHE_NAME = "hotel-pms-v1"
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/favicon.svg",
  "/manifest.webmanifest",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event

  // Only handle GET requests
  if (request.method !== "GET") return

  const url = new URL(request.url)

  // Avoid caching Supabase API or cross-origin live DB calls in SW
  if (url.origin.includes("supabase.co")) {
    return
  }

  // Network-first for HTML pages (navigations)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/index.html"))
    )
    return
  }

  // Stale-while-revalidate for static assets (js, css, images, fonts)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === "basic"
          ) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return networkResponse
        })
        .catch(() => cachedResponse)

      return cachedResponse || fetchPromise
    })
  )
})
