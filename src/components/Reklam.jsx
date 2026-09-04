import { useEffect, useRef } from 'react'
import { REKLAM_BLOKLARI, reklamAktif } from '../lib/reklam.js'
import { cx } from '../lib/utils.js'

/**
 * Tek bir Yandex RTB reklam alanı.
 *
 * - Reklam yalnızca canlı alan adında + production'da yüklenir (reklamAktif).
 * - İlgili yerleşimin blok kimliği tanımlı değilse hiçbir şey render edilmez.
 * - Oyun / soru çözme / sınav / kart ekranlarında KULLANILMAZ.
 * - `data-ka-manuel` işareti korunur.
 *
 * Yandex kuyruk mantığı: window.yaContextCb bir dizidir; context.js yüklenince
 * kuyruktaki render çağrılarını işler. Betik henüz yüklenmemişse push zararsızca
 * bekler. Guard nedeniyle canlı-dışı ortamda hiç push yapılmaz.
 */
export default function Reklam({ yer = 'anaSayfa', className }) {
  const blok = REKLAM_BLOKLARI[yer]
  const aktif = reklamAktif()
  const basildi = useRef(false)

  useEffect(() => {
    if (!blok || !aktif || basildi.current) return
    basildi.current = true
    try {
      window.yaContextCb = window.yaContextCb || []
      window.yaContextCb.push(() => {
        try {
          window.Ya.Context.AdvManager.render({ blockId: blok, renderTo: `yandex_rtb_${blok}` })
        } catch {
          /* betik hazır değil / engellenmiş — sessizce geç */
        }
      })
    } catch {
      /* window yok — sessizce geç */
    }
  }, [blok, aktif])

  if (!blok || !aktif) return null

  return (
    <div className={cx('my-4', className)} data-ka-manuel="1">
      <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-ink-400">Reklam</p>
      <div id={`yandex_rtb_${blok}`} data-ka-manuel="1" />
    </div>
  )
}
