/* global caches, fetch, self */

const cacheName = 'world-demucs-v0.1.0'
const scope = self.registration.scope

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(cacheName)
      .then((cache) =>
        cache.addAll([
          scope,
          `${scope}models/demucs-manifest.json`,
          `${scope}worklets/stem-processor.js`,
          `${scope}manifest.webmanifest`,
        ]),
      ),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key))),
      ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || !request.url.startsWith(scope)) return

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          const copy = response.clone()
          caches.open(cacheName).then((cache) => cache.put(request, copy))
          return response
        }),
    ),
  )
})
