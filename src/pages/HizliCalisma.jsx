import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDersler, getHavuz } from '../lib/data.js'
import { useAsync, useProgress } from '../lib/hooks.js'
import { cevapKaydet, kayitToggle } from '../lib/storage.js'
import { cx, harf, karistir, sayi } from '../lib/utils.js'
import { Bos, Hata, Ilerleme, Yukleniyor, Rozet } from '../components/UI.jsx'
import { Baslik } from '../components/Layout.jsx'
import { IconCheck, IconWrong, IconBookmark, IconChevron, IconFlame } from '../components/Icons.jsx'

/* Hızlı Çalışma — Android'deki HizliCalismaActivity'nin karşılığı.
 *
 * Soru çözme ekranından farkı: tek ekranda soru + şıklar, cevaplayınca
 * ANINDA sonraki soruya geçer (bekleme yok). Açıklama isteğe bağlı olarak
 * kapatılabilir; amaç dakikada çok soru görmek, derinlemesine çalışmak değil.
 * Doğru/yanlış yine kalıcı ilerlemeye ve tekrar kuyruğuna işlenir. */

export default function HizliCalisma() {
  const p = useProgress()
  const [secilen, setSecilen] = useState([])
  const [basladi, setBasladi] = useState(false)
  const [aciklamaAcik, setAciklamaAcik] = useState(true)
  const [i, setI] = useState(0)
  const [sonuc, setSonuc] = useState(null) // { secim, dogru }
  const [skor, setSkor] = useState({ dogru: 0, yanlis: 0 })
  const [seri, setSeri] = useState(0)

  const { veri: dersler } = useAsync(() => getDersler(), [])

  const { veri, yukleniyor, hata, yenile } = useAsync(async () => {
    if (!basladi) return null
    const havuz = await getHavuz(secilen, 40)
    return { sorular: karistir(havuz).slice(0, 40) }
  }, [basladi, secilen.join(',')])

  const sorular = veri?.sorular || []
  const soru = sorular[i]

  useEffect(() => setSonuc(null), [i])

  if (!basladi) {
    const liste = dersler || []
    return (
      <>
        <Baslik baslik="Hızlı Çalışma" altBaslik="Kısa sürede çok soru gör" />
        <div className="card mb-4 p-4">
          <p className="text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
            Cevapladığın anda sonraki soruya geçer. 40 soruluk hızlı tur; doğrular ve yanlışlar
            istatistiklerine ve tekrar kuyruğuna işlenir.
          </p>
        </div>

        <h2 className="section-title mb-2">Dersler</h2>
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {liste.map((d) => {
            const aktif = secilen.includes(d.id)
            return (
              <button
                key={d.id}
                onClick={() => setSecilen((s) => (aktif ? s.filter((x) => x !== d.id) : [...s, d.id]))}
                className={cx(
                  'card p-3 text-left transition',
                  aktif ? '!border-brand-500 !bg-brand-50 dark:!bg-brand-500/10' : 'hover:border-brand-300'
                )}
              >
                <p className="text-sm font-bold leading-tight">{d.ad}</p>
                <p className="mt-0.5 text-[11px] text-ink-400">{sayi(d.soruSayisi)} soru</p>
              </button>
            )
          })}
        </div>

        <label className="card mb-4 flex items-center justify-between p-4">
          <span className="text-sm font-semibold">Açıklamaları göster</span>
          <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={aciklamaAcik} onChange={(e) => setAciklamaAcik(e.target.checked)} />
        </label>

        <button className="btn-primary w-full" disabled={!secilen.length} onClick={() => setBasladi(true)}>
          {secilen.length ? `${secilen.length} dersle başla` : 'En az bir ders seç'}
        </button>
      </>
    )
  }

  if (yukleniyor) return <Yukleniyor satir={4} />
  if (hata) return <Hata hata={hata} yenile={yenile} />
  if (!sorular.length) return <Bos baslik="Soru bulunamadı" />

  if (i >= sorular.length) {
    const oran = Math.round((skor.dogru / sorular.length) * 100)
    return (
      <>
        <Baslik baslik="Tur Bitti" geri={false} />
        <div className="card p-6 text-center">
          <p className="text-3xl font-extrabold">
            {skor.dogru}/{sorular.length}
          </p>
          <p className="text-sm text-ink-500">%{oran} doğru</p>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              className="btn-outline"
              onClick={() => {
                setI(0)
                setSkor({ dogru: 0, yanlis: 0 })
                setSeri(0)
                yenile()
              }}
            >
              Yeni Tur
            </button>
            <Link className="btn-primary" to="/istatistik">
              İstatistik
            </Link>
          </div>
        </div>
      </>
    )
  }

  const cevapla = (secim) => {
    if (sonuc) return
    const dogru = secim === soru.dogru
    setSonuc({ secim, dogru })
    setSkor((s) => ({ dogru: s.dogru + (dogru ? 1 : 0), yanlis: s.yanlis + (dogru ? 0 : 1) }))
    setSeri((s) => (dogru ? s + 1 : 0))
    cevapKaydet({ soruId: soru.id, dersId: soru.dersId, konuId: soru.konuId, dogruMu: dogru, sureSn: 0 })
    /* Açıklama kapalıysa beklemeye gerek yok — hemen ilerle. */
    if (!aciklamaAcik) setTimeout(() => setI((x) => x + 1), 260)
  }

  return (
    <>
      <Baslik
        baslik="Hızlı Çalışma"
        altBaslik={`${i + 1} / ${sorular.length}`}
        sag={
          <div className="flex items-center gap-2">
            {seri >= 3 && (
              <Rozet renk="turuncu">
                <IconFlame size={12} /> {seri}
              </Rozet>
            )}
            <button
              onClick={() => kayitToggle(soru.id, soru.dersId)}
              className={cx('rounded-xl p-2', p.kayitlilar[soru.id] ? 'text-brand-600' : 'text-ink-400')}
              aria-label="Kaydet"
            >
              <IconBookmark size={18} />
            </button>
          </div>
        }
      />

      <div className="mb-3 flex items-center gap-3">
        <Ilerleme deger={i + 1} toplam={sorular.length} ince />
        <span className="shrink-0 text-xs font-semibold tabular-nums text-ink-400">
          <span className="text-emerald-600">{skor.dogru}</span> / <span className="text-red-500">{skor.yanlis}</span>
        </span>
      </div>

      <div className="card mb-3 p-4">
        <p className="text-[15px] font-medium leading-relaxed">{soru.soru}</p>
      </div>

      <div className="space-y-2">
        {soru.secenekler.map((s, ix) => {
          const secildi = sonuc?.secim === ix
          const dogruSik = sonuc && ix === soru.dogru
          return (
            <button
              key={ix}
              onClick={() => cevapla(ix)}
              disabled={!!sonuc}
              className={cx(
                'flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition',
                dogruSik
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                  : secildi
                    ? 'border-red-500 bg-red-50 dark:bg-red-500/10'
                    : 'border-ink-200 bg-white hover:border-brand-400 dark:border-white/10 dark:bg-ink-900'
              )}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-ink-100 text-xs font-extrabold text-ink-500 dark:bg-white/10 dark:text-ink-300">
                {harf(ix)}
              </span>
              <span className="flex-1 text-[14px] leading-relaxed">{s}</span>
              {dogruSik && <IconCheck size={17} className="shrink-0 text-emerald-600" />}
              {secildi && !sonuc?.dogru && <IconWrong size={17} className="shrink-0 text-red-500" />}
            </button>
          )
        })}
      </div>

      {sonuc && aciklamaAcik && soru.aciklama && (
        <div className="card mt-3 border-l-4 !border-l-brand-500 p-4">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Açıklama</p>
          <p className="mt-1.5 whitespace-pre-line text-[14px] leading-relaxed">{soru.aciklama}</p>
        </div>
      )}

      {sonuc && aciklamaAcik && (
        <button className="btn-primary mt-3 w-full" onClick={() => setI((x) => x + 1)}>
          Sonraki <IconChevron size={17} />
        </button>
      )}
    </>
  )
}
