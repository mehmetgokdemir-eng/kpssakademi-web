/* KPSS Akademi — service worker
   Strateji:
   - HTML (navigasyon): network-first, çevrimdışıysa cache'ten app shell
   - /assets/* (hash'li build çıktıları): cache-first (immutable)
   - /data/*.json (soru/kart/deneme verisi): stale-while-revalidate
*/
const VERSION = 'ka-v1.0.0'
const SHELL = `${VERSION}-shell`
const ASSETS = `${VERSION}-assets`
const DATA = `${VERSION}-data`

const SHELL_URLS = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(SHELL_URLS)).then(() => self.skipWaiting()).catch(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting()
})

async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName)
  try {
    const res = await fetch(req)
    if (res && res.ok) cache.put(req, res.clone())
    return res
  } catch (err) {
    const cached = await cache.match(req)
    return cached || (await caches.match('/index.html')) || Response.error()
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(req)
  if (cached) return cached
  const res = await fetch(req)
  if (res && res.ok) cache.put(req, res.clone())
  return res
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(req)
  const network = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(req, res.clone())
      return res
    })
    .catch(() => cached)
  return cached || network
}

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    e.respondWith(networkFirst(request, SHELL))
    return
  }
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/media/')) {
    e.respondWith(cacheFirst(request, ASSETS))
    return
  }
  if (url.pathname.startsWith('/data/')) {
    e.respondWith(staleWhileRevalidate(request, DATA))
    return
  }
})
