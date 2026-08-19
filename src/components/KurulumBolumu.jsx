import { useEffect, useMemo, useState } from 'react'
import { ls } from '../lib/utils.js'
import { cx } from '../lib/utils.js'
import { IconInstall, IconClose, IconCheck } from './Icons.jsx'

/* "Uygulama olarak yükle" bölümü.
 *
 * Neden ayrı bir bölüm: InstallPrompt yalnızca `beforeinstallprompt` olayı
 * geldiğinde çıkıyor. O olay iOS Safari'de HİÇ tetiklenmez, masaüstü
 * Safari/Firefox'ta da yoktur — yani iPhone kullanıcıları uygulamayı
 * kurabileceklerini hiç öğrenemiyordu. Burada her platform için adımlar
 * yazılı duruyor; kullanıcının kendi platformu öne çıkarılıyor ama
 * diğerlerine de sekmelerden bakılabiliyor.
 */

const KAPATILDI = 'ka:kurulum-bolumu-kapali'

function platformBul() {
  if (typeof navigator === 'undefined') return 'masaustu'
  const ua = navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  if (iOS) return 'ios'
  if (/Android/.test(ua)) return 'android'
  return 'masaustu'
}

/** Uygulama zaten kurulu ve kurulu pencerede mi açık? */
function kuruluMu() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
}

const ADIMLAR = {
  ios: {
    ad: 'iPhone / iPad',
    tarayici: 'Safari',
    not: 'iOS’ta kurulum yalnızca Safari’den yapılabilir. Chrome ile açtıysan önce adresi Safari’de aç.',
    adimlar: [
      'Sayfayı Safari’de aç.',
      'Alt çubuktaki Paylaş simgesine dokun (kutudan yukarı çıkan ok).',
      'Listeyi kaydır, “Ana Ekrana Ekle”ye dokun.',
      'Sağ üstten “Ekle”ye dokun.',
    ],
  },
  android: {
    ad: 'Android',
    tarayici: 'Chrome',
    not: 'Samsung Internet’te de aynı adımlar geçerli; menüde “Sayfayı ekle → Ana ekran” yazar.',
    adimlar: [
      'Sayfayı Chrome’da aç.',
      'Sağ üstteki ⋮ menüsüne dokun.',
      '“Uygulamayı yükle” ya da “Ana ekrana ekle”ye dokun.',
      'Açılan kutuda “Yükle”yi onayla.',
    ],
  },
  masaustu: {
    ad: 'Bilgisayar',
    tarayici: 'Chrome / Edge',
    not: 'Safari ve Firefox’ta uygulama olarak kurulum yoktur; sayfayı yer imlerine ekleyebilirsin (Ctrl + D).',
    adimlar: [
      'Adres çubuğunun sağındaki ⊕ (yükle) simgesine tıkla.',
      'Simge yoksa ⋮ menüsünden “Uygulamayı yükle”yi seç.',
      'Açılan kutuda “Yükle”yi onayla.',
      'Uygulama ayrı bir pencerede, kendi simgesiyle açılır.',
    ],
  },
}

export default function KurulumBolumu() {
  const kendi = useMemo(platformBul, [])
  const [sekme, setSekme] = useState(kendi)
  const [olay, setOlay] = useState(null)
  const [kurulu, setKurulu] = useState(kuruluMu)
  const [kapali, setKapali] = useState(() => ls.get(KAPATILDI, false))

  useEffect(() => {
    const yakala = (e) => {
      e.preventDefault()
      setOlay(e)
    }
    const kuruldu = () => {
      setKurulu(true)
      setOlay(null)
    }
    window.addEventListener('beforeinstallprompt', yakala)
    window.addEventListener('appinstalled', kuruldu)
    return () => {
      window.removeEventListener('beforeinstallprompt', yakala)
      window.removeEventListener('appinstalled', kuruldu)
    }
  }, [])

  if (kurulu || kapali) return null

  const p = ADIMLAR[sekme]

  return (
    <section className="card relative mb-4 overflow-hidden p-0">
      <button
        onClick={() => {
          setKapali(true)
          ls.set(KAPATILDI, true)
        }}
        className="absolute right-2 top-2 rounded-lg p-1.5 text-ink-300 hover:bg-ink-100 hover:text-ink-500 dark:hover:bg-white/10"
        aria-label="Kapat"
      >
        <IconClose size={15} />
      </button>

      <div className="flex gap-3 p-4 pb-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
          <IconInstall size={22} />
        </span>
        <div className="min-w-0 pr-6">
          <h2 className="text-[15px] font-bold leading-tight">Telefonuna uygulama olarak kur</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
            Ana ekranına simgesi eklenir, tam ekran açılır ve <b>internet olmadan da çalışır</b>. Mağazadan
            indirmene gerek yok, yer kaplamaz. Çözdüğün sorular ve istatistiklerin aynı kalır.
          </p>
        </div>
      </div>

      {/* Tarayıcı doğrudan kurulumu destekliyorsa tek tıkla bitir */}
      {olay && (
        <div className="px-4 pb-3">
          <button
            className="btn-primary w-full"
            onClick={async () => {
              olay.prompt()
              const s = await olay.userChoice
              if (s?.outcome === 'accepted') setKurulu(true)
              setOlay(null)
            }}
          >
            <IconInstall size={17} /> Şimdi Yükle
          </button>
          <p className="mt-1.5 text-center text-[11px] text-ink-400">
            Tarayıcın tek tıkla kurulumu destekliyor — adımları okumana gerek yok.
          </p>
        </div>
      )}

      <div className="border-t border-ink-100 px-4 pt-3 dark:border-white/5">
        <div className="mb-3 flex gap-1.5">
          {Object.entries(ADIMLAR).map(([id, v]) => (
            <button
              key={id}
              onClick={() => setSekme(id)}
              className={cx(
                'flex-1 rounded-xl px-2 py-1.5 text-xs font-semibold transition',
                sekme === id ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 dark:bg-white/5 dark:text-ink-300'
              )}
            >
              {v.ad}
              {id === kendi && <span className="ml-1 opacity-70">•</span>}
            </button>
          ))}
        </div>

        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">{p.tarayici} ile</p>
        <ol className="space-y-1.5 pb-3">
          {p.adimlar.map((a, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                {i + 1}
              </span>
              <span className="text-ink-600 dark:text-ink-300">{a}</span>
            </li>
          ))}
        </ol>
        <p className="flex gap-2 pb-4 text-[12px] leading-relaxed text-ink-400">
          <IconCheck size={14} className="mt-0.5 shrink-0" />
          <span>{p.not}</span>
        </p>
      </div>
    </section>
  )
}
