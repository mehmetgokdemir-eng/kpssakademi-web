import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getDersler } from '../lib/data.js'
import { useAsync, useProgress } from '../lib/hooks.js'
import { useSettings } from '../lib/settings.jsx'
import {
  bugun,
  bugunDersSayilari,
  planOku,
  planSifirla,
  planYaz,
  tekrarOzet,
} from '../lib/storage.js'
import { planGorevleri, planUret, kocMesaji } from '../lib/kocluk.js'
import { cx, sayi, yuzde } from '../lib/utils.js'
import { Halka, Hata, Ilerleme, Yukleniyor } from '../components/UI.jsx'
import { Baslik } from '../components/Layout.jsx'
import { DersIkon, IconCheck, IconRefresh, IconTarget, IconChevron } from '../components/Icons.jsx'

/* Bugünün Planı — "bugün Tarih'ten 20, Matematik'ten 30 soru çöz".
 *
 * Plan lib/kocluk.js'te üretilir: sınavdaki soru ağırlığı × zayıflık. Gün
 * içinde sabit kalması için storage'a mühürlenir (planOku/planYaz); yoksa
 * kullanıcı soru çözdükçe hedefler gözünün önünde değişirdi. */

export default function Plan() {
  const p = useProgress()
  const { settings, set } = useSettings()
  const { veri: dersler, yukleniyor, hata, yenile } = useAsync(() => getDersler(), [])

  const gorevler = useMemo(() => {
    if (!dersler?.length) return []
    let hedef = planOku()
    if (!hedef) {
      const uretilen = planUret({
        cozulen: p.cozulen,
        dersler,
        gunlukHedef: settings.gunlukHedef,
      })
      hedef = uretilen?.hedef || {}
      if (Object.keys(hedef).length) planYaz(hedef)
    }
    return planGorevleri({ hedef, dersler, bugunSayilar: bugunDersSayilari() })
  }, [dersler, p.cozulen, settings.gunlukHedef])

  const ozet = tekrarOzet()
  const g = p.gunluk[bugun()] || { soru: 0, dogru: 0 }
  const toplamHedef = gorevler.reduce((t, x) => t + x.hedef, 0)
  const toplamYapilan = gorevler.reduce((t, x) => t + Math.min(x.yapilan, x.hedef), 0)
  const oran = yuzde(toplamYapilan, toplamHedef)
  const biten = gorevler.filter((x) => x.bitti).length

  const koc = kocMesaji({
    gunluk: p.gunluk,
    cozulen: p.cozulen,
    tekrarSayisi: ozet.bugun || 0,
    bugunSoru: g.soru,
    gunlukHedef: settings.gunlukHedef,
    seri: p.seri?.gun || 0,
  })

  if (yukleniyor) return <Yukleniyor satir={4} />
  if (hata) return <Hata hata={hata} yenile={yenile} />

  return (
    <>
      <Baslik baslik="Bugünün Planı" altBaslik="Zayıf derslerine göre dağıtıldı" />

      <div className="card mb-4 flex items-center gap-4 p-4">
        <Halka deger={oran} alt="plan" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{koc.baslik}</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">{koc.metin}</p>
          <p className="mt-2 text-xs text-ink-400">
            {toplamYapilan} / {toplamHedef} soru · {biten}/{gorevler.length} ders tamam
          </p>
        </div>
      </div>

      {ozet.bugun > 0 && (
        <Link to="/tekrar" className="card mb-4 flex items-center gap-3 p-4 hover:border-brand-300">
          <span className="rounded-xl bg-amber-50 p-2.5 text-amber-600 dark:bg-amber-500/15">
            <IconRefresh size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">Önce dünün tekrarı</p>
            <p className="mt-0.5 text-xs text-ink-500">
              {sayi(ozet.bugun)} soru tekrar zamanına geldi. Yeni soruya geçmeden bunları bitirmek en hızlı yol.
            </p>
          </div>
          <IconChevron size={18} className="shrink-0 text-ink-300" />
        </Link>
      )}

      <h2 className="section-title mb-2">Dersler</h2>
      <div className="space-y-2.5">
        {gorevler.map((x) => (
          <Link
            key={x.dersId}
            to={`/ders/${x.dersId}/konu/karisik`}
            className={cx('card flex items-center gap-3 p-3.5 hover:border-brand-300', x.bitti && 'opacity-70')}
          >
            <span
              className={cx(
                'rounded-xl p-2.5',
                x.bitti ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15' : 'bg-brand-50 text-brand-600 dark:bg-brand-500/15'
              )}
            >
              {x.bitti ? <IconCheck size={20} /> : <DersIkon ikon={x.dersId} size={20} />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-bold">{x.ad}</p>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-ink-500">
                  {x.yapilan} / {x.hedef}
                </span>
              </div>
              <div className="mt-1.5">
                <Ilerleme deger={Math.min(x.yapilan, x.hedef)} toplam={x.hedef} ince renk={x.bitti ? 'bg-emerald-500' : 'bg-brand-600'} />
              </div>
              <p className="mt-1 text-[11px] text-ink-400">
                {x.bitti ? 'Tamamlandı' : `${x.kalan} soru kaldı`}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="card mt-4 p-4">
        <div className="flex items-center gap-2">
          <IconTarget size={17} className="text-brand-600" />
          <p className="text-sm font-bold">Günlük hedefin</p>
        </div>
        <div className="mt-2.5 flex items-center gap-4">
          <input
            type="range"
            min="10"
            max="200"
            step="10"
            value={settings.gunlukHedef}
            onChange={(e) => {
              set({ gunlukHedef: Number(e.target.value) })
              planSifirla()
            }}
            className="h-2 flex-1 accent-brand-600"
          />
          <span className="w-20 shrink-0 text-right text-2xl font-extrabold tabular-nums text-brand-600">
            {settings.gunlukHedef}
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
          Hedefi değiştirdiğinde plan yeniden dağıtılır. Dağıtım, dersin sınavdaki soru sayısı ile senin o
          dersteki doğru oranına göre yapılır — çok soru gelen ve zayıf olduğun ders en çok payı alır.
        </p>
        <button
          className="btn-ghost mt-3 w-full !text-xs"
          onClick={() => planSifirla()}
        >
          Planı yeniden kur
        </button>
      </div>
    </>
  )
}
