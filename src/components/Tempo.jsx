import { useEffect, useState } from 'react'
import { TEMPO_SN } from '../lib/kocluk.js'
import { cx } from '../lib/utils.js'
import { IconClock } from './Icons.jsx'

/* Tempo göstergesi — KPSS'nin süre baskısını soru çözerken de hissettirir.
 *
 * NEDEN: Genel Yetenek–Genel Kültür oturumu 120 soru / 130 dakika, yani soru
 * başına 65 saniye. Konuyu bilmek yetmiyor; o hızda uygulayabilmek gerekiyor.
 * Evde süresiz çözen aday sınavda zamana yeniliyor.
 *
 * Sayaç soru DEĞİŞTİĞİNDE sıfırlanır (anahtar prop'u ile). Cevap verilince
 * durur — cevabı okurken geçen süre tempoyu bozmasın diye. */

export default function Tempo({ anahtar, durdu = false, hedefSn = TEMPO_SN }) {
  const [sn, setSn] = useState(0)

  useEffect(() => {
    setSn(0)
  }, [anahtar])

  useEffect(() => {
    if (durdu) return
    const t = setInterval(() => setSn((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [durdu, anahtar])

  const oran = Math.min(100, Math.round((sn / hedefSn) * 100))
  const asti = sn > hedefSn
  const yaklasti = !asti && sn > hedefSn * 0.75

  return (
    <div className="flex items-center gap-2" title={`KPSS temposu: soru başına ${hedefSn} saniye`}>
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
        <div
          className={cx(
            'h-full rounded-full transition-all duration-1000 ease-linear',
            asti ? 'bg-red-500' : yaklasti ? 'bg-amber-500' : 'bg-emerald-500'
          )}
          style={{ width: `${oran}%` }}
        />
      </div>
      <span
        className={cx(
          'flex items-center gap-1 text-xs font-semibold tabular-nums',
          asti ? 'text-red-500' : yaklasti ? 'text-amber-600' : 'text-ink-400'
        )}
      >
        <IconClock size={13} />
        {sn}s
      </span>
    </div>
  )
}
