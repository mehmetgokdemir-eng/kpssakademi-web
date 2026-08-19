/* KPSS Akademi — service worker
   Strateji:
   - HTML (navigasyon): network-first, çevrimdışıysa cache'ten app shell
   - /assets/* (hash'li build çıktıları): cache-first (immutable)
   - /data/*.json (soru/kart/deneme verisi): stale-while-revalidate
*/
const VERSION = 'ka-1.0.0-dev'
const SHELL = `${VERSION}-shell`
const ASSETS = `${VERSION}-assets`
const DATA = `${VERSION}-data`

/* Uygulama kabuğu tek bir anahtarla ('/') saklanır. Navigasyonları istek
   adresine göre ayrı ayrı saklamak hem cache'i şişiriyor hem de her yeni
   yolda çevrimdışı boşluk bırakıyordu; hepsi aynı index.html'i döndürüyor. */
const KABUK = '/'
const ON_BELLEK = [KABUK, '/manifest.webmanifest', '/icons/icon.svg']

/* Ne kabuk ne de ağ varsa gösterilecek en son çare.
   Eskiden burada Response.error() dönüyordu; tarayıcı bunu BOŞ BEYAZ EKRAN
   olarak gösteriyor ve kullanıcı hatanın ne olduğunu anlamıyordu. */
const CEVRIMDISI = `<!doctype html><html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Bağlantı yok — KPSS Akademi</title>
<style>body{margin:0;display:grid;place-items:center;min-height:100vh;background:#12141f;color:#eceef2;
font:16px/1.6 system-ui,sans-serif;text-align:center;padding:24px}b{font-size:19px}
a{color:#7f9bff;display:inline-block;margin-top:18px}</style></head><body><div>
<b>Bağlantı kurulamadı</b><p>KPSS Akademi'yi açmak için internet bağlantını kontrol et.</p>
<a href="/">Tekrar dene</a></div></body></html>`

const cevrimdisiYanit = () =>
  new Response(CEVRIMDISI, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } })

self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const c = await caches.open(SHELL)
      /* addAll TEK PARÇADIR: bir adres bile hata verirse hiçbiri yazılmaz ve
         kabuk cache'i boş kalır. Tek tek yazıp hataları yutuyoruz. */
      await Promise.all(ON_BELLEK.map((u) => c.add(u).catch(() => {})))
      /* İlk kurulumda hemen devreye gir. Sonraki sürümlerde BEKLE: kullanıcı
         "yeni sürüm hazır" bildirimini onaylayınca skipWaiting mesajı gelir.
         Burada koşulsuz skipWaiting çağırmak o bildirimi işlevsiz bırakıyor,
         ayrıca eski JS çalışan bir sayfaya yeni worker'ı bağlıyordu. */
      if (!self.registration.active) await self.skipWaiting()
    })()
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
      await self.clients.claim()
    })()
  )
})

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting()
})

/* Navigasyon: önce ağ. Başarılı HTML'i tek kabuk anahtarına yazar. */
async function navigasyon(req) {
  const cache = await caches.open(SHELL)
  try {
    const res = await fetch(req)
    if (res && res.ok) cache.put(KABUK, res.clone())
    return res
  } catch {
    return (await cache.match(KABUK)) || (await cache.match(req)) || cevrimdisiYanit()
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(req)
  if (cached) return cached
  try {
    const res = await fetch(req)
    if (res && res.ok) cache.put(req, res.clone())
    return res
  } catch {
    return new Response('', { status: 504 })
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(req)
  const network = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(req, res.clone())
      return res
    })
    .catch(() => cached || new Response('', { status: 504 }))
  return cached || network
}

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    e.respondWith(navigasyon(request))
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
