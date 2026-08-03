/* isaque.it portfolio service worker — shell cache */
const CACHE = 'isaque-it-v1'
const SHELL = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './assets/css/tokens.css',
  './assets/css/base.css',
  './assets/css/site.css',
  './assets/cube/cube.css',
  './assets/cube/hero.css',
  './assets/js/app.js',
  './assets/js/case-page.js',
  './data/copy.json',
  './data/projects.json',
  './data/catalog.json',
  './data/milestones.json',
  './data/principles.json',
  './assets/img/brand/cube.svg',
  './assets/img/icons/icon-192.png',
  './assets/img/icons/icon-512.png',
  './assets/img/icons/apple-touch-180.png',
  './cases/cube/index.html',
  './cases/miodelivery/index.html',
  './cases/platform/index.html',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await Promise.all(
        SHELL.map((url) => cache.add(url).catch(() => undefined))
      )
    }).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((cache) => cache.put(req, copy))
          return res
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match('./offline.html'))
        )
    )
    return
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put(req, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || fetched
    })
  )
})
