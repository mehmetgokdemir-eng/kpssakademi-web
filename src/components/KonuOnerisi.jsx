import { Link } from 'react-router-dom'
import { getKonular, getDersler } from '../lib/data.js'
import { useAsync } from '../lib/hooks.js'
import { denemeOnerisi } from '../lib/kocluk.js'
import { cx } from '../lib/utils.js'
import { IconBulb, IconChevron } from './Icons.jsx'

/* Deneme sonrası konu bazlı öneri — "Problemler ve Sayılar'a çalışman lazım".
 *
 * Ders bazlı analiz "Matematik'te 8 yanlış" der ama nereye çalışacağını
 * söylemez. Burada yanlışlar KONU kırılımına indiriliyor; en çok yanlış
 * yapılan konular, doğrudan o konunun sorularına giden bağlantılarla
 * listeleniyor. Veri denemenin kendi sorularından geliyor, tahmin yok. */

export default function KonuOnerisi({ sorular, cevaplar }) {
  const { veri } = useAsync(async () => {
    const [konular, dersler] = await Promise.all([getKonular(), getDersler()])
    return {
      konuAdlari: Object.fromEntries(konular.map((k) => [`${k.dersId}:${k.id}`, k.ad])),
      dersAdlari: Object.fromEntries(dersler.map((d) => [d.id, d.ad])),
    }
  }, [])

  if (!veri) return null

  const sonuclar = (sorular || []).map((s) => ({
    dersId: s.dersId,
    konuId: s.konuId,
    dogruMu: cevaplar?.[s.id] === s.dogru,
  }))
  const oneriler = denemeOnerisi(sonuclar, veri.konuAdlari, veri.dersAdlari)

  if (!oneriler.length)
    return (
      <div className="card mb-4 border-l-4 !border-l-emerald-500 p-4">
        <p className="text-sm font-bold">Bu denemede zayıf konu çıkmadı</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
          Yanlışın yok ya da yanlışların tek bir konuda toplanmıyor. Tempoyu korumak için bir sonraki denemeye
          geçebilirsin.
        </p>
      </div>
    )

  return (
    <div className="mb-4">
      <div className="card border-l-4 !border-l-amber-500 p-4">
        <div className="flex items-center gap-2">
          <IconBulb size={18} className="text-amber-500" />
          <p className="text-sm font-bold">Bunlara çalışman lazım</p>
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
          Yanlışların en çok şu konularda toplandı. Yeni deneme çözmeden önce bunları kapatmak, net kazanmanın
          en hızlı yolu.
        </p>
        <div className="mt-3 space-y-2">
          {oneriler.map((o) => (
            <Link
              key={`${o.dersId}:${o.konuId}`}
              to={`/ders/${o.dersId}/konu/${o.konuId}`}
              className="flex items-center gap-3 rounded-xl bg-ink-50 p-3 hover:bg-ink-100 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold">{o.ad}</p>
                <p className="mt-0.5 text-[11px] text-ink-400">
                  {o.dersAd} · {o.toplam} sorudan <b className="text-red-500">{o.yanlis} yanlış</b> (%{o.oran})
                </p>
              </div>
              <span className="shrink-0 text-[11px] font-semibold text-brand-600">Çöz</span>
              <IconChevron size={16} className="shrink-0 text-ink-300" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
