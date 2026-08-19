/* Otomatik reklam (Auto ads) denetimi.
 *
 * AdSense panelinden otomatik reklamlar AÇIK. Google yerleşimi kendi seçtiği
 * için, "oyunlarda ve soru/sınav akışında reklam olmasın" kuralını tek başına
 * panel garanti edemiyor. Denetim iki katmanlı:
 *
 *   1) BİRİNCİL — AdSense panelindeki URL hariç tutmaları (ADSENSE.md § 3).
 *      Google'ın kendi mekanizması; reklam hiç istenmez.
 *   2) YEDEK — bu dosya. Yasaklı rotalarda otomatik yerleştirilen kapsayıcıları
 *      DOM'dan kaldırır. SPA'da rota değişimi Google'a "yeni sayfa" gibi
 *      görünmediği için, panel hariç tutması istemci tarafı geçişlerde her
 *      zaman devreye girmez; bu katman o boşluğu kapatır.
 *
 * Manuel reklam birimleri (components/Reklam.jsx) `data-ka-manuel` ile
 * işaretli ve buradan ASLA etkilenmez.
 */

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Yedek katmanı tamamen kapatmak için false yap. */
export const OTOMATIK_REKLAM_ENGELI = true

/** Otomatik reklamın görünmemesi gereken rotalar. */
export const YASAKLI_ROTALAR = [
  /^\/oyun\//, //                       oyun ekranları (Harita Avcısı, Maraton, ...)
  /^\/quiz\/oyna\/?$/, //               quiz çözülürken
  /^\/deneme\//, //                     deneme sınavı sürerken
  /^\/ders\/[^/]+\/konu\//, //          soru çözme ekranı
  /^\/kartlar\/[^/]+/, //               bilgi kartı çevirme ekranı
]

export function otomatikYasak(pathname) {
  return YASAKLI_ROTALAR.some((r) => r.test(pathname))
}

/* Google'ın otomatik yerleştirdiği kapsayıcılar. Manuel <ins> birimlerimizde
   bu öznitelikler bulunmaz. */
const OTOMATIK_SECICILER = [
  '.google-auto-placed',
  'ins.adsbygoogle[data-anchor-status]',
  'ins.adsbygoogle[data-anchor-shown]',
  'ins.adsbygoogle[data-vignette-loaded]',
]

function temizle() {
  for (const secici of OTOMATIK_SECICILER) {
    let dugumler
    try {
      dugumler = document.querySelectorAll(secici)
    } catch {
      continue
    }
    dugumler.forEach((el) => {
      if (el.hasAttribute('data-ka-manuel')) return
      if (el.closest('[data-ka-manuel]')) return
      if (el.querySelector('[data-ka-manuel]')) return
      el.remove()
    })
  }
}

/**
 * App içine bir kez yerleştirilir. Rota yasaklıysa otomatik reklam
 * kapsayıcılarını gizler ve DOM'a sonradan eklenenleri kaldırır.
 */
export default function OtomatikReklamKontrol() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (!OTOMATIK_REKLAM_ENGELI) return
    const kapali = otomatikYasak(pathname)
    document.body.classList.toggle('ka-oto-reklam-kapali', kapali)
    if (!kapali) return

    temizle()

    let bekleyen = false
    const gozlemci = new MutationObserver(() => {
      if (bekleyen) return
      bekleyen = true
      requestAnimationFrame(() => {
        bekleyen = false
        temizle()
      })
    })
    gozlemci.observe(document.body, { childList: true, subtree: true })

    return () => {
      gozlemci.disconnect()
      document.body.classList.remove('ka-oto-reklam-kapali')
    }
  }, [pathname])

  return null
}
