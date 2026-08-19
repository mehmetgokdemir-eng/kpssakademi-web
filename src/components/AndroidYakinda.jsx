import { useState } from 'react'
import { ls } from '../lib/utils.js'
import { IconClose } from './Icons.jsx'

/* Sağ yan şeritte duran "Android uygulaması çok yakında" kartı.
 *
 * Uygulama Google Play'de yayına hazırlanıyor; henüz herkese açık değil.
 * Yayına girdiğinde tek yapılacak: YAYINDA'yı true çevirmek ve PLAY_ADRESI'ni
 * doğrulamak. Kart o anda "Google Play'den indir" düğmesine dönüşür.
 */

const KAPATILDI = 'ka:android-yakinda-kapali'

export const YAYINDA = false
export const PLAY_ADRESI = 'https://play.google.com/store/apps/details?id=com.nihangokdemir.kpss'

function IconAndroid({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.6 9.48a5.6 5.6 0 0 0-11.2 0v.02h11.2v-.02ZM8.9 7.2a.6.6 0 1 1 0-1.2.6.6 0 0 1 0 1.2Zm6.2 0a.6.6 0 1 1 0-1.2.6.6 0 0 1 0 1.2ZM6.7 6.3 5.6 4.6a.3.3 0 0 1 .5-.32l1.12 1.7a.3.3 0 0 1-.5.33Zm10.6 0a.3.3 0 0 1-.5-.33l1.12-1.7a.3.3 0 0 1 .5.32L17.3 6.3ZM4.9 10.6c-.72 0-1.3.58-1.3 1.3v4.9a1.3 1.3 0 0 0 2.6 0v-4.9c0-.72-.58-1.3-1.3-1.3Zm14.2 0c-.72 0-1.3.58-1.3 1.3v4.9a1.3 1.3 0 0 0 2.6 0v-4.9c0-.72-.58-1.3-1.3-1.3ZM6.4 10.6v7.7c0 .6.48 1.1 1.08 1.1h1.02v2.3a1.3 1.3 0 0 0 2.6 0v-2.3h1.8v2.3a1.3 1.3 0 0 0 2.6 0v-2.3h1.02c.6 0 1.08-.5 1.08-1.1v-7.7H6.4Z" />
    </svg>
  )
}

export default function AndroidYakinda({ kompakt = false }) {
  const [kapali, setKapali] = useState(() => ls.get(KAPATILDI, false))
  if (kapali) return null

  const kapat = () => {
    setKapali(true)
    ls.set(KAPATILDI, true)
  }

  return (
    <div className="relative rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-3 dark:border-emerald-400/20 dark:bg-emerald-400/[0.07]">
      <button
        onClick={kapat}
        className="absolute right-1.5 top-1.5 rounded p-1 text-ink-300 hover:text-ink-500"
        aria-label="Kapat"
      >
        <IconClose size={13} />
      </button>

      <div className="mb-1.5 flex items-start gap-2 pr-4">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-600 text-white">
          <IconAndroid size={16} />
        </span>
        <p className="flex-1 pt-0.5 text-[12px] font-bold leading-tight">Android uygulaması</p>
      </div>

      {YAYINDA ? (
        <>
          <p className="mb-2 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
            Google Play'de yayında. Aynı içerik, aynı ilerleme.
          </p>
          <a href={PLAY_ADRESI} target="_blank" rel="noreferrer" className="btn-primary w-full !bg-emerald-600 !py-1.5 !text-[11px]">
            Google Play'den indir
          </a>
        </>
      ) : (
        <>
          <span className="mb-2 inline-block rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Çok yakında
          </span>
          <p className="text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
            Google Play'de yayına hazırlanıyor. O zamana kadar siteyi telefonuna uygulama olarak
            kurabilirsin — aynı şekilde çalışır, çevrimdışı da açılır.
          </p>
        </>
      )}
    </div>
  )
}
