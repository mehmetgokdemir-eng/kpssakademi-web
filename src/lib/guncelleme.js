/* Uygulama içi güncelleme — Android'deki In-App Update'in web karşılığı.
 *
 * Service worker yeni bir sürüm indirdiğinde "beklemede" (waiting) duruma geçer
 * ve kullanıcı tüm sekmeleri kapatana kadar devreye girmez. Burada bunu yakalayıp
 * kullanıcıya "yeni sürüm hazır" bildirimi gösteriyoruz; onayladığında bekleyen
 * worker'a skipWaiting mesajı gidiyor ve sayfa yenileniyor.
 */

let bekleyen = null // ServiceWorker (waiting)
const dinleyiciler = new Set()

export function guncellemeAbone(fn) {
  dinleyiciler.add(fn)
  fn(!!bekleyen)
  return () => dinleyiciler.delete(fn)
}

const bildir = () => dinleyiciler.forEach((f) => f(!!bekleyen))

function bekleyeniAyarla(sw) {
  if (!sw) return
  bekleyen = sw
  bildir()
}

/** Kullanıcı "Güncelle" dediğinde çağrılır. */
export function guncellemeyiUygula() {
  if (!bekleyen) return
  // controllerchange bir kez tetiklenir → sayfayı o anda yenile
  let yenilendi = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (yenilendi) return
    yenilendi = true
    window.location.reload()
  })
  bekleyen.postMessage('skipWaiting')
}

/** main.jsx'ten bir kez çağrılır. */
export function serviceWorkerKaydet() {
  if (!('serviceWorker' in navigator)) return

  navigator.serviceWorker
    .register('/sw.js')
    .then((reg) => {
      // Sayfa açıldığında zaten bekleyen bir sürüm olabilir
      if (reg.waiting && navigator.serviceWorker.controller) bekleyeniAyarla(reg.waiting)

      reg.addEventListener('updatefound', () => {
        const yeni = reg.installing
        if (!yeni) return
        yeni.addEventListener('statechange', () => {
          // controller varsa bu ilk kurulum değil, gerçek bir güncelleme
          if (yeni.state === 'installed' && navigator.serviceWorker.controller) bekleyeniAyarla(yeni)
        })
      })

      // Sekme yeniden görünür olduğunda ve saatte bir güncelleme kontrolü
      const kontrol = () => reg.update().catch(() => {})
      document.addEventListener('visibilitychange', () => !document.hidden && kontrol())
      setInterval(kontrol, 60 * 60 * 1000)
    })
    .catch(() => {})
}
