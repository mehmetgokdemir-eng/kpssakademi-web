import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DERS_REFERANS, PUAN_TURLERI, hedefIcinNet, kpssPuan, netBasinaKatki } from '../lib/kpss.js'
import { useProgress } from '../lib/hooks.js'
import { useSettings, sinavBilgisi } from '../lib/settings.jsx'
import { cx, sayi } from '../lib/utils.js'
import { Rozet } from '../components/UI.jsx'
import { Baslik } from '../components/Layout.jsx'
import { IconTarget, IconQuiz, IconCalc, IconFlame } from '../components/Icons.jsx'

/* Hedef Puan — Android'deki HedefPuanActivity'nin karşılığı.
 *
 * Hesabı kendim uydurmuyorum: lib/kpss.js içindeki hedefIcinNet() zaten
 * "hedefe ulaşmak için hangi dersten kaç net" sorusunu, net başına puan
 * katkısı en yüksek dersten başlayarak çözüyor. Bu sayfa onu görünür kılıp
 * kalan güne bölüyor. */

const SEVIYELER = [
  { esik: 0, ad: 'Başlangıç', metin: 'Yeni başlıyorsun. Az ama her gün çözmek, ara vererek çok çözmekten daha hızlı ilerletir.' },
  { esik: 40, ad: 'Gelişiyor', metin: 'Temel oturuyor. Bundan sonra en hızlı kazanç, yanlışlarını biriktirip tekrar etmekte.' },
  { esik: 60, ad: 'İyi', metin: 'Ortalamanın üstündesin. Genel tekrar yerine zayıf konuları hedefleyerek çalış.' },
  { esik: 75, ad: 'Güçlü', metin: 'Sağlam seviyedesin. Sıradaki adım deneme sınavlarıyla süre yönetimini oturtmak.' },
  { esik: 88, ad: 'Yarışçı', metin: 'Yüksek puan bandındasın. Buradan sonrası yeni konu değil, hata payını düşürmek ve hız.' },
]

export default function HedefPuan() {
  const p = useProgress()
  const { settings, set } = useSettings()
  const [hedef, setHedef] = useState(settings.hedefPuan || 80)
  const [tur, setTur] = useState(settings.puanTuru || 'P3')

  const sinav = sinavBilgisi(settings)
  const kalanGun = Math.max(1, Math.ceil((sinav.tarih.getTime() - Date.now()) / 864e5))

  const durum = useMemo(() => {
    const vals = Object.values(p.cozulen)
    const dogru = vals.filter((v) => v.d).length
    return { cozulen: vals.length, dogru, oran: vals.length ? Math.round((dogru / vals.length) * 100) : 0 }
  }, [p.cozulen])

  const plan = useMemo(() => hedefIcinNet(hedef, tur), [hedef, tur])
  const katki = useMemo(() => netBasinaKatki(tur), [tur])

  const toplamNet = Object.values(plan.netler).reduce((t, n) => t + n, 0)
  const toplamSoru = Object.keys(plan.netler).reduce((t, d) => t + (DERS_REFERANS[d]?.soru || 0), 0)

  /* Günlük soru hedefi: hedefe ulaşmak için görülmesi gereken net kadar
     soruyu, mevcut doğru oranını hesaba katarak kalan güne böl. Oran
     düştükçe aynı neti tutturmak için daha çok soru görmek gerekir. */
  const oran = Math.max(0.35, durum.oran / 100 || 0.5)
  const gunluk = Math.max(20, Math.round((toplamNet / oran) * 6 / kalanGun) + 15)

  const seviye = [...SEVIYELER].reverse().find((s) => durum.oran >= s.esik) || SEVIYELER[0]
  const enVerimli = [...katki].sort((a, b) => b.katki - a.katki).slice(0, 3)

  return (
    <>
      <Baslik baslik="Hedef Puan" altBaslik="Hedefine göre net ve günlük plan" />

      <div className="card mb-4 p-4">
        <label className="text-[13px] font-semibold uppercase tracking-wide text-ink-400">Hedef puanın</label>
        <div className="mt-2 flex items-center gap-4">
          <input
            type="range"
            min="50"
            max="95"
            value={hedef}
            onChange={(e) => setHedef(Number(e.target.value))}
            className="h-2 flex-1 accent-brand-600"
          />
          <span className="w-16 shrink-0 text-right text-3xl font-extrabold tabular-nums text-brand-600">{hedef}</span>
        </div>
        <label className="mt-4 block text-[13px] font-semibold uppercase tracking-wide text-ink-400">Puan türü</label>
        <select className="input mt-1.5" value={tur} onChange={(e) => setTur(e.target.value)}>
          {Object.entries(PUAN_TURLERI).map(([id, v]) => (
            <option key={id} value={id}>
              {v.ad}
            </option>
          ))}
        </select>
      </div>

      {!plan.mumkun && (
        <div className="card mb-4 border-l-4 !border-l-red-500 p-4">
          <p className="text-sm font-bold">Bu puan bu türde ulaşılamıyor</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
            Tüm soruları doğru yapsan bile {tur} türünde en fazla ~{plan.ulasilan} puan çıkıyor. Hedefi düşür ya da
            farklı bir puan türü seç.
          </p>
        </div>
      )}

      <div className="mb-4 grid grid-cols-3 gap-2.5">
        <Kutu etiket="Kalan gün" deger={sayi(kalanGun)} renk="text-brand-600" />
        <Kutu etiket="Gereken net" deger={toplamNet.toFixed(0)} alt={`/ ${toplamSoru} soru`} renk="text-violet-600" />
        <Kutu etiket="Şu anki oran" deger={`%${durum.oran}`} renk={durum.oran >= 70 ? 'text-emerald-600' : 'text-amber-600'} />
      </div>

      <h2 className="section-title mb-2">Dersten kaç net gerekiyor</h2>
      <div className="mb-5 space-y-2">
        {Object.entries(plan.netler)
          .sort((a, b) => b[1] - a[1])
          .map(([d, n]) => {
            const ref = DERS_REFERANS[d] || { soru: 0, ad: d }
            const yuzdelik = ref.soru ? Math.round((n / ref.soru) * 100) : 0
            return (
              <div key={d} className="card flex items-center gap-3 p-3.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{ref.ad || d}</p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${yuzdelik}%` }} />
                  </div>
                </div>
                <span className="shrink-0 text-right text-sm font-extrabold tabular-nums">
                  {n.toFixed(0)}
                  <span className="text-[11px] font-medium text-ink-400"> / {ref.soru}</span>
                </span>
              </div>
            )
          })}
      </div>

      <div className="card mb-4 border-l-4 !border-l-brand-500 p-4">
        <div className="flex items-center gap-2">
          <IconTarget size={18} className="text-brand-600" />
          <p className="text-sm font-bold">Günde {sayi(gunluk)} soru</p>
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
          {sinav.ad} sınavına <b>{kalanGun} gün</b> var. Bu tempoyla sınava kadar yaklaşık{' '}
          <b>{sayi(gunluk * kalanGun)}</b> soru görürsün.
        </p>
        <button className="btn-primary mt-3 w-full" onClick={() => set({ hedefPuan: hedef, puanTuru: tur, gunlukHedef: gunluk })}>
          Günlük hedefimi bu yap
        </button>
        <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
          Net hesabı ÖSYM'nin standart puan formülüne dayanıyor; günlük soru sayısı ise mevcut doğru oranından
          çıkarılan bir tahmindir. Gerçek puan o yılki ortalama ve standart sapmaya göre değişir.
        </p>
      </div>

      <div className="card mb-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <IconFlame size={17} className="text-amber-500" />
          <p className="text-sm font-bold">{seviye.ad}</p>
          <Rozet renk="gri">{sayi(durum.cozulen)} soru çözdün</Rozet>
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">{seviye.metin}</p>
        {enVerimli.length > 0 && (
          <p className="mt-2 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
            Bu puan türünde 1 net en çok şuralarda kazandırıyor:{' '}
            <b>{enVerimli.map((k) => k.ad || k.ders).join(', ')}</b>.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Link className="btn-primary" to="/analiz">
          <IconQuiz size={17} /> Zayıf Konularım
        </Link>
        <Link className="btn-ghost" to="/puan-hesapla">
          <IconCalc size={17} /> Puan Hesapla
        </Link>
      </div>
    </>
  )
}

function Kutu({ etiket, deger, renk, alt }) {
  return (
    <div className="card p-3 text-center">
      <p className={cx('text-xl font-extrabold tabular-nums', renk)}>{deger}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400">{etiket}</p>
      {alt && <p className="text-[10px] text-ink-400">{alt}</p>}
    </div>
  )
}
