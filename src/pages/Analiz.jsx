import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getDersler, getKonular } from '../lib/data.js'
import { useAsync, useProgress } from '../lib/hooks.js'
import { cx, sayi, yuzde } from '../lib/utils.js'
import { Bos, Hata, Yukleniyor, Rozet } from '../components/UI.jsx'
import { Baslik } from '../components/Layout.jsx'
import { IconQuiz, IconTarget, IconChevron } from '../components/Icons.jsx'

/* Analiz — Android'deki AnalizActivity'nin karşılığı.
 *
 * İstatistik sayfası "ne kadar çalıştım"ı gösterir; burası "NEREDE ZAYIFIM"a
 * cevap verir. Konu konu başarı oranı çıkarılır ve en zayıf konular öne
 * alınır. Az denenmiş konular yanıltmasın diye en az 5 soru çözülmüş olması
 * şartı var; altındakiler ayrı bir "yeterli veri yok" bölümünde listelenir. */

const ESIK = 5

export default function Analiz() {
  const p = useProgress()
  const { veri, yukleniyor, hata, yenile } = useAsync(async () => {
    const [dersler, konular] = await Promise.all([getDersler(), getKonular()])
    return { dersler, konular }
  }, [])

  const analiz = useMemo(() => {
    if (!veri) return null
    const konuAd = Object.fromEntries(veri.konular.map((k) => [k.id, k.ad]))
    const dersAd = Object.fromEntries(veri.dersler.map((d) => [d.id, d.ad]))

    const konuSay = new Map()
    const dersSay = new Map()
    for (const v of Object.values(p.cozulen)) {
      if (!v.dersId) continue
      const dk = `${v.dersId}|${v.konuId || '_'}`
      const k = konuSay.get(dk) || { dersId: v.dersId, konuId: v.konuId, toplam: 0, dogru: 0 }
      k.toplam++
      if (v.d) k.dogru++
      konuSay.set(dk, k)

      const d = dersSay.get(v.dersId) || { toplam: 0, dogru: 0 }
      d.toplam++
      if (v.d) d.dogru++
      dersSay.set(v.dersId, d)
    }

    const hepsi = [...konuSay.values()].map((k) => ({
      ...k,
      ad: konuAd[k.konuId] || k.konuId || 'Karışık',
      dersAd: dersAd[k.dersId] || k.dersId,
      oran: Math.round((k.dogru / k.toplam) * 100),
    }))
    const yeterli = hepsi.filter((k) => k.toplam >= ESIK).sort((a, b) => a.oran - b.oran)
    const az = hepsi.filter((k) => k.toplam < ESIK).sort((a, b) => b.toplam - a.toplam)
    const dersler = [...dersSay.entries()]
      .map(([id, v]) => ({ id, ad: dersAd[id] || id, ...v, oran: Math.round((v.dogru / v.toplam) * 100) }))
      .sort((a, b) => a.oran - b.oran)
    return { yeterli, az, dersler, toplam: hepsi.reduce((t, k) => t + k.toplam, 0) }
  }, [veri, p.cozulen])

  if (yukleniyor) return <Yukleniyor satir={5} />
  if (hata) return <Hata hata={hata} yenile={yenile} />

  if (!analiz || !analiz.toplam)
    return (
      <>
        <Baslik baslik="Analiz" altBaslik="Zayıf konularını bul" geri={false} />
        <Bos
          baslik="Henüz analiz edilecek veri yok"
          aciklama="Soru çözmeye başladığında konu konu başarı oranın burada çıkar."
          ikon={<IconTarget size={34} />}
        />
        <Link className="btn-primary mt-4 w-full" to="/dersler">
          Soru Çözmeye Başla
        </Link>
      </>
    )

  const renk = (o) => (o >= 70 ? 'text-emerald-600' : o >= 50 ? 'text-amber-600' : 'text-red-500')
  const cubuk = (o) => (o >= 70 ? 'bg-emerald-500' : o >= 50 ? 'bg-amber-500' : 'bg-red-500')

  const zayif = analiz.yeterli.slice(0, 8)
  const guclu = [...analiz.yeterli].reverse().slice(0, 5)

  return (
    <>
      <Baslik baslik="Analiz" altBaslik={`${sayi(analiz.toplam)} çözülmüş soru üzerinden`} geri={false} />

      {zayif.length > 0 && (
        <>
          <h2 className="section-title mb-2">Önce buraya çalış</h2>
          <div className="mb-5 space-y-2">
            {zayif.map((k) => (
              <Link
                key={k.dersId + k.konuId}
                to={`/ders/${k.dersId}/konu/${k.konuId || 'karisik'}`}
                className="card flex items-center gap-3 p-3.5 transition hover:border-brand-400"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{k.ad}</p>
                  <p className="text-[11px] text-ink-400">
                    {k.dersAd} · {k.toplam} soru · {k.dogru} doğru
                  </p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
                    <div className={cx('h-full rounded-full', cubuk(k.oran))} style={{ width: `${k.oran}%` }} />
                  </div>
                </div>
                <span className={cx('shrink-0 text-lg font-extrabold tabular-nums', renk(k.oran))}>%{k.oran}</span>
                <IconChevron size={16} className="shrink-0 text-ink-300" />
              </Link>
            ))}
          </div>
        </>
      )}

      <h2 className="section-title mb-2">Ders bazında</h2>
      <div className="mb-5 space-y-2">
        {analiz.dersler.map((d) => (
          <div key={d.id} className="card flex items-center gap-3 p-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{d.ad}</p>
              <p className="text-[11px] text-ink-400">
                {sayi(d.toplam)} soru · {sayi(d.dogru)} doğru
              </p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
                <div className={cx('h-full rounded-full', cubuk(d.oran))} style={{ width: `${d.oran}%` }} />
              </div>
            </div>
            <span className={cx('shrink-0 text-lg font-extrabold tabular-nums', renk(d.oran))}>%{d.oran}</span>
          </div>
        ))}
      </div>

      {guclu.length > 0 && (
        <>
          <h2 className="section-title mb-2">Güçlü olduğun konular</h2>
          <div className="mb-5 flex flex-wrap gap-2">
            {guclu.map((k) => (
              <Rozet key={k.dersId + k.konuId} renk="yesil">
                {k.ad} · %{k.oran}
              </Rozet>
            ))}
          </div>
        </>
      )}

      {analiz.az.length > 0 && (
        <>
          <h2 className="section-title mb-2">Yeterli veri yok</h2>
          <p className="mb-2 text-[12px] text-ink-400">
            Bu konularda {ESIK}'ten az soru çözdün; oran güvenilir değil.
          </p>
          <div className="flex flex-wrap gap-2">
            {analiz.az.slice(0, 14).map((k) => (
              <Link key={k.dersId + k.konuId} to={`/ders/${k.dersId}/konu/${k.konuId || 'karisik'}`}>
                <Rozet renk="gri">
                  {k.ad} · {k.toplam}
                </Rozet>
              </Link>
            ))}
          </div>
        </>
      )}

      <Link className="btn-primary mt-5 w-full" to={zayif[0] ? `/ders/${zayif[0].dersId}/konu/${zayif[0].konuId || 'karisik'}` : '/dersler'}>
        <IconQuiz size={17} /> {zayif[0] ? `En zayıf konunu çöz: ${zayif[0].ad}` : 'Soru Çöz'}
      </Link>
    </>
  )
}
