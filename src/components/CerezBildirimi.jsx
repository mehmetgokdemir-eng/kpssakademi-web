import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { onayAbone, onayDurumu, onayKaydet } from '../lib/reklam.js'

/**
 * Çerez / reklam kişiselleştirme bildirimi.
 *
 * Dürüstlük notu: reklamlar kişiselleştirme reddedilse de gösterilir —
 * yalnızca ilgi alanına göre hedefleme kapanır. Bu yüzden butonlar
 * "Kabul et / Reddet" değil, "İzin ver / Kişiselleştirme istemiyorum".
 */
export default function CerezBildirimi() {
  const [durum, setDurum] = useState(onayDurumu)
  const [gorunur, setGorunur] = useState(false)

  useEffect(() => onayAbone(setDurum), [])

  // Sayfa açılır açılmaz değil, kısa bir gecikmeyle göster — ilk izlenimi bozmasın
  useEffect(() => {
    if (durum != null) return
    const t = setTimeout(() => setGorunur(true), 1200)
    return () => clearTimeout(t)
  }, [durum])

  if (durum != null || !gorunur) return null

  return (
    <div
      role="dialog"
      aria-label="Çerez tercihi"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ink-200 bg-white/95 p-4 backdrop-blur-lg animate-slideUp dark:border-white/10 dark:bg-ink-900/95"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-[13px] leading-relaxed text-ink-600 dark:text-ink-300">
          Bu sitede Google reklamları gösteriliyor. Reklamların ilgi alanlarına göre kişiselleştirilmesi için
          çerez kullanımına izin verebilirsin. İzin vermezsen reklamlar yine gösterilir, yalnızca
          kişiselleştirilmez.{' '}
          <Link to="/gizlilik" className="font-semibold text-brand-600 underline dark:text-brand-400">
            Ayrıntılar
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button className="btn-outline !py-2 !text-xs" onClick={() => onayKaydet('kisisellestirmesiz')}>
            Kişiselleştirme istemiyorum
          </button>
          <button className="btn-primary !py-2 !text-xs" onClick={() => onayKaydet('izin')}>
            İzin ver
          </button>
        </div>
      </div>
    </div>
  )
}
