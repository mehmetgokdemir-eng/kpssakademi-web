import { useEffect, useRef, useState } from 'react'
import { useSettings } from '../lib/settings.jsx'
import { IconMusic } from './Icons.jsx'
import { cx } from '../lib/utils.js'

/* Arka plan müziği — Android sürümündeki res/raw dosyalarının web karşılığı.
   Dosyalar public/media/ altına konur. Dosya yoksa oynatıcı sessizce gizlenir. */
export const PARCALAR = [
  { id: 'chopin', ad: 'Chopin — Nocturne Op.9 No.2', src: '/media/chopin_nocturne_op9.mp3' },
  { id: 'gitar', ad: 'Dingin Gitar', src: '/media/guitar_ambient.mp3' },
]

export default function MusicPlayer() {
  const { settings, set } = useSettings()
  const ref = useRef(null)
  const [hata, setHata] = useState(false)

  const parca = PARCALAR.find((p) => p.id === settings.muzikParca) || PARCALAR[0]

  useEffect(() => {
    const a = ref.current
    if (!a) return
    a.volume = settings.muzikSes
    if (settings.muzikAcik) {
      a.play().catch(() => {
        /* otomatik oynatma engellendi — kullanıcı etkileşimi beklenir */
      })
    } else {
      a.pause()
    }
  }, [settings.muzikAcik, settings.muzikParca, settings.muzikSes])

  if (hata) return null

  return (
    <>
      <audio ref={ref} src={parca.src} loop preload="none" onError={() => setHata(true)} />
      {settings.muzikAcik && (
        <button
          onClick={() => set({ muzikAcik: false })}
          className={cx(
            'fixed bottom-24 right-4 z-30 flex items-center gap-2 rounded-full bg-brand-600/95 px-3.5 py-2.5',
            'text-xs font-semibold text-white shadow-lift backdrop-blur'
          )}
          title={`${parca.ad} — durdurmak için dokun`}
        >
          <IconMusic size={16} />
          <span className="hidden sm:inline">{parca.ad}</span>
          <span className="flex h-3 items-end gap-[2px]">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-[3px] rounded-sm bg-white/90"
                style={{ height: `${6 + ((i * 7) % 9)}px`, animation: `pulse 1.${3 + i}s ease-in-out ${i * 0.15}s infinite` }}
              />
            ))}
          </span>
        </button>
      )}
    </>
  )
}
