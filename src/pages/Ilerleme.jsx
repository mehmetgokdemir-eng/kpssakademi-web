import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getDersler } from '../lib/data.js'
import { useAsync, useProgress } from '../lib/hooks.js'
import { genelIstatistik } from '../lib/storage.js'
import { dersPerformansi, ilerleme } from '../lib/kocluk.js'
import { cx, sayi, tarihFormat } from '../lib/utils.js'
import { Bos, Hata, Ilerleme as Cubuk, Yukleniyor } from '../components/UI.jsx'
import { Baslik } from '../components/Layout.jsx'
import { DersIkon, IconChart, IconFlame, IconTarget } from '../components/Icons.jsx'

/* İlerleme — "başlangıçta neredeydim, bugün neredeyim".
 *
 * Karşılaştırma uydurma değil: çözüm kayıtları zaman damgasına göre sıralanıp
 * ilk çeyrek ile son çeyrek penceresinin doğru oranı kıyaslanıyor (kocluk.js
 * → ilerleme). Az veriyle yanıltmamak için en az 40 çözüm şartı var. */

export default function Ilerleme() {
  const p = useProgress()
  const { veri: dersler, yukleniyor, hata, yenile } = useAsync(() => getDersler(), [])
  const ist = genelIstatistik()

  const il = useMemo(() => ilerleme(p.cozulen), [p.cozulen])
  const perf = useMemo(() => dersPerformansi(p.cozulen), [p.cozulen])

  if (yukleniyor) return <Yukleniyor satir={4} />
  if (hata) return <Hata hata={hata} yenile={yenile} />

  if (!il.yeterli)
    return (
      <>
        <Baslik baslik="İlerlemem" altBaslik="Başlangıçtan bugüne" />
        <Bos
          baslik="Henüz karşılaştırma için erken"
          aciklama={`İlerlemeni ölçebilmem için en az ${il.gereken} soru gerekiyor; şu an ${sayi(il.toplam)} sorudasın. Çözmeye devam et, sonra buraya dön.`}
          aksiyon={
            <Link className="btn-primary" to="/plan">
              Bugünkü plana git
            </Link>
          }
        />
      </>
    )

  const artis = il.fark > 0
  const dersSatirlari = (dersler || [])
    .map((d) => ({ ...d, p: perf[d.id] }))
    .filter((d) => (d.p?.toplam || 0) >= 10)
    .sort((a, b) => (b.p.oran || 0) - (a.p.oran || 0))

  return (
    <>
      <Baslik baslik="İlerlemem" altBaslik="Başlangıçtan bugüne" />

      <div className="card mb-4 p-5">
        <div className="flex items-end justify-between gap-4">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Başlangıç</p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums text-ink-400">%{il.ilkOran}</p>
            <p className="mt-0.5 text-[11px] text-ink-400">{tarihFormat(il.ilkTarih)}</p>
          </div>
          <div className="flex-1 pb-3">
            <div className="relative h-2 rounded-full bg-ink-100 dark:bg-white/10">
              <div
                className={cx('absolute inset-y-0 left-0 rounded-full', artis ? 'bg-emerald-500' : 'bg-amber-500')}
                style={{ width: `${Math.min(100, Math.max(il.ilkOran, il.sonOran))}%` }}
              />
            </div>
            <p className={cx('mt-2 text-center text-sm font-extrabold', artis ? 'text-emerald-600' : 'text-amber-600')}>
              {artis ? '+' : ''}
              {il.fark} puan
            </p>
          </div>
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Bugün</p>
            <p className={cx('mt-1 text-3xl font-extrabold tabular-nums', artis ? 'text-emerald-600' : 'text-brand-600')}>
              %{il.sonOran}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-400">{tarihFormat(il.sonTarih)}</p>
          </div>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
          {artis
            ? `İlk ${il.pencere} sorunda %${il.ilkOran} doğru yapıyordun, son ${il.pencere} soruda %${il.sonOran}. ${il.gunFark} günde ${il.fark} puan yükseldin.`
            : il.fark === 0
              ? `İlk ve son ${il.pencere} sorundaki doğru oranın aynı (%${il.sonOran}). Oranı yükseltmek için yeni soru yerine yanlışlarına ve tekrara ağırlık ver.`
              : `Son ${il.pencere} sorudaki oranın başlangıçtan ${Math.abs(il.fark)} puan düşük. Bu genelde zorluk artınca olur — yeni ve daha zor konulara geçmiş olabilirsin. Zayıf konularını tekrar et.`}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2.5">
        <Kutu etiket="Toplam soru" deger={sayi(ist.toplam)} renk="text-brand-600" />
        <Kutu etiket="Doğru oranı" deger={`%${ist.oran}`} renk="text-emerald-600" />
        <Kutu etiket="Günlük seri" deger={`${ist.seri}`} renk="text-amber-600" />
      </div>

      <h2 className="section-title mb-2">Derslerdeki durumun</h2>
      {dersSatirlari.length === 0 ? (
        <p className="text-sm text-ink-500">Ders bazlı karşılaştırma için her dersten en az 10 soru çözmen gerekiyor.</p>
      ) : (
        <div className="space-y-2">
          {dersSatirlari.map((d) => {
            const o = Math.round((d.p.oran || 0) * 100)
            return (
              <Link key={d.id} to={`/ders/${d.id}/konu/karisik`} className="card flex items-center gap-3 p-3.5 hover:border-brand-300">
                <span className="rounded-xl bg-ink-50 p-2 text-ink-500 dark:bg-white/5">
                  <DersIkon ikon={d.id} size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-bold">{d.ad}</p>
                    <span
                      className={cx(
                        'shrink-0 text-sm font-extrabold tabular-nums',
                        o >= 70 ? 'text-emerald-600' : o >= 50 ? 'text-amber-600' : 'text-red-500'
                      )}
                    >
                      %{o}
                    </span>
                  </div>
                  <div className="mt-1.5">
                    <Cubuk deger={d.p.dogru} toplam={d.p.toplam} ince renk={o >= 70 ? 'bg-emerald-500' : o >= 50 ? 'bg-amber-500' : 'bg-red-500'} />
                  </div>
                  <p className="mt-1 text-[11px] text-ink-400">{sayi(d.p.toplam)} soru çözdün</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Link className="btn-primary" to="/analiz">
          <IconChart size={17} /> Zayıf Konularım
        </Link>
        <Link className="btn-ghost" to="/plan">
          <IconTarget size={17} /> Bugünkü Plan
        </Link>
      </div>
    </>
  )
}

function Kutu({ etiket, deger, renk }) {
  return (
    <div className="card p-3 text-center">
      <p className={cx('text-xl font-extrabold tabular-nums', renk)}>{deger}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-400">{etiket}</p>
    </div>
  )
}
