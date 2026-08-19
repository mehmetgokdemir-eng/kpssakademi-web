import { useEffect, useRef, useState } from 'react'
import { ADSENSE_ID, SLOTLAR, onayAbone, onayVerildi } from '../lib/reklam.js'
import { cx } from '../lib/utils.js'

/**
 * Tek bir reklam alanı.
 *
 * - Kullanıcı çerez bildirimine yanıt vermeden reklam yüklenmez.
 * - İlgili slot kimliği tanımlı değilse hiçbir şey render edilmez.
 * - Oyun ekranlarında ve soru çözme / sınav akışında KULLANILMAZ
 *   (yanlışlıkla tıklama ve kullanıcı deneyimi nedeniyle).
 * - `data-ka-manuel` işareti, otomatik reklam temizleyicisinin (lib/otomatikReklam.js)
 *   bu birimi yanlışlıkla kaldırmasını önler — işareti KALDIRMAYIN.
 */
export default function Reklam({ yer = 'anaSayfa', className }) {
  const slot = SLOTLAR[yer]
  const insRef = useRef(null)
  const yuklendiRef = useRef(false)
  const [onayli, setOnayli] = useState(onayVerildi)

  useEffect(() => onayAbone(() => setOnayli(onayVerildi())), [])

  useEffect(() => {
    if (!slot || !onayli || yuklendiRef.current) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      yuklendiRef.current = true
    } catch {
      /* reklam engelleyici veya betik yüklenmemiş — sessizce geç */
    }
  }, [slot, onayli])

  if (!slot || !onayli) return null

  return (
    <div className={cx('my-4', className)} data-ka-manuel="1">
      <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-ink-400">Reklam</p>
      <ins
        ref={insRef}
        data-ka-manuel="1"
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
