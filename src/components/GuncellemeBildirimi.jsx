import { useEffect, useState } from 'react'
import { guncellemeAbone, guncellemeyiUygula } from '../lib/guncelleme.js'
import { IconRefresh, IconClose } from './Icons.jsx'

/** "Yeni sürüm hazır" şeridi — Android'deki in-app update bildiriminin karşılığı. */
export default function GuncellemeBildirimi() {
  const [varMi, setVarMi] = useState(false)
  const [gizli, setGizli] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)

  useEffect(() => guncellemeAbone(setVarMi), [])

  if (!varMi || gizli) return null

  return (
    <div className="fixed inset-x-3 top-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-brand-200 bg-white p-3 shadow-lift animate-slideUp dark:border-brand-500/30 dark:bg-ink-900">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
        <IconRefresh size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">Yeni sürüm hazır</p>
        <p className="text-xs text-ink-500">Güncellemek için birkaç saniye sürer.</p>
      </div>
      <button
        className="btn-primary !px-3 !py-1.5 !text-xs"
        disabled={yukleniyor}
        onClick={() => {
          setYukleniyor(true)
          guncellemeyiUygula()
        }}
      >
        {yukleniyor ? 'Güncelleniyor…' : 'Güncelle'}
      </button>
      <button className="rounded-lg p-1 text-ink-400" onClick={() => setGizli(true)} aria-label="Kapat">
        <IconClose size={16} />
      </button>
    </div>
  )
}
