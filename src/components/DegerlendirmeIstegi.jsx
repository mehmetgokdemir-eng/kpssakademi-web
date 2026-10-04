import { useState } from 'react'
import { Link } from 'react-router-dom'
import { istenmeliMi, ertele, kapat } from '../lib/degerlendirme.js'
import { YAYINDA, PLAY_ADRESI } from './AndroidYakinda.jsx'
import { IconTrophy, IconClose, IconNote } from './Icons.jsx'

/**
 * Ana sayfada, yeterince kullanım sonrası çıkan puan/görüş isteği.
 * Engelleyici bir pencere değil; akışı kesmeyen bir kart.
 */
export default function DegerlendirmeIstegi() {
  const [gorunur, setGorunur] = useState(istenmeliMi)

  if (!gorunur) return null

  const gizle = (kalici) => {
    kalici ? kapat() : ertele()
    setGorunur(false)
  }

  return (
    <div className="card relative mb-4 overflow-hidden border-l-4 !border-l-amber-400 p-4">
      <button
        onClick={() => gizle(false)}
        className="absolute right-2 top-2 rounded-lg p-1 text-ink-300 hover:text-ink-500"
        aria-label="Şimdi değil"
      >
        <IconClose size={15} />
      </button>

      <div className="flex gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-500/15">
          <IconTrophy size={20} />
        </span>
        <div className="min-w-0 flex-1 pr-4">
          <p className="text-sm font-bold">Nasıl gidiyor?</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
            KPSS Akademi'yi bir süredir kullanıyorsun. Eksik bulduğun, yanlış gördüğün ya da eklenmesini
            istediğin bir şey varsa yazman yeter.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {YAYINDA && (
              <a
                href={PLAY_ADRESI}
                target="_blank"
                rel="noreferrer"
                className="btn-primary !py-2 !text-xs"
                onClick={() => gizle(true)}
              >
                ★ Play Store'da puan ver
              </a>
            )}
            <Link to="/iletisim" className="btn-outline !py-2 !text-xs" onClick={() => gizle(false)}>
              <IconNote size={14} /> Görüş bildir
            </Link>
            <button className="btn-ghost !py-2 !text-xs" onClick={() => gizle(true)}>
              Bir daha sorma
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
