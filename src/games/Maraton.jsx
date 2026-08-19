import { useState } from 'react'
import { getDersler, getHavuz } from '../lib/data.js'
import { useAsync, useProgress } from '../lib/hooks.js'
import { cevapKaydet, oyunSkor, kayitToggle } from '../lib/storage.js'
import { karistir, cx } from '../lib/utils.js'
import { Yukleniyor, Hata, Bos } from '../components/UI.jsx'
import SoruKarti from '../components/SoruKarti.jsx'
import { IconRefresh, IconTrophy, IconFlame } from '../components/Icons.jsx'

const CAN = 3

export default function Maraton() {
  const p = useProgress()
  const { veri, yukleniyor, hata, yenile } = useAsync(async () => {
    const dersler = await getDersler()
    const sorular = await getHavuz([], 200)
    return { adlar: Object.fromEntries(dersler.map((d) => [d.id, d.ad])), sorular: karistir(sorular).slice(0, 400) }
  }, [])

  const [oyun, setOyun] = useState(null)

  if (yukleniyor) return <Yukleniyor satir={4} />
  if (hata) return <Hata hata={hata} yenile={yenile} />
  if (!veri?.sorular?.length) return <Bos baslik="Soru bulunamadı" />

  const basla = () => setOyun({ sorular: karistir(veri.sorular), i: 0, can: CAN, skor: 0, seri: 0, enIyiSeri: 0, secim: null, bitti: false })

  if (!oyun) {
    return (
      <div className="card p-6 text-center">
        <IconFlame size={34} className="mx-auto text-rose-500" />
        <h2 className="mt-2 text-lg font-extrabold">Maraton</h2>
        <p className="mt-1 text-sm text-ink-500">
          {CAN} canın var. Her doğru cevap puan kazandırır, üst üste doğrular puanı katlar. Canların bitince oyun sona erer.
        </p>
        <button className="btn-primary mt-4 w-full" onClick={basla}>
          Başla
        </button>
      </div>
    )
  }

  if (oyun.bitti) {
    return (
      <>
        <div className="card p-6 text-center">
          <IconTrophy size={34} className="mx-auto text-rose-500" />
          <p className="mt-2 text-4xl font-extrabold text-rose-500">{oyun.skor}</p>
          <p className="text-sm text-ink-500">
            {oyun.i} soru · en uzun seri {oyun.enIyiSeri}
          </p>
          {p.oyun.maraton && <p className="mt-1 text-xs text-ink-400">Rekorun: {p.oyun.maraton.enIyi}</p>}
        </div>
        <button className="btn-primary mt-3 w-full" onClick={basla}>
          <IconRefresh size={17} /> Tekrar Oyna
        </button>
      </>
    )
  }

  const soru = oyun.sorular[oyun.i]

  function cevapla(secim, dogruMu) {
    if (oyun.secim != null) return
    cevapKaydet({ soruId: soru.id, dersId: soru.dersId, konuId: soru.konuId, dogruMu })
    setOyun((o) => {
      const seri = dogruMu ? o.seri + 1 : 0
      const kazanc = dogruMu ? 10 * Math.min(5, 1 + Math.floor(seri / 3)) : 0
      return {
        ...o,
        secim,
        skor: o.skor + kazanc,
        seri,
        enIyiSeri: Math.max(o.enIyiSeri, seri),
        can: dogruMu ? o.can : o.can - 1,
      }
    })
  }

  function sonraki() {
    setOyun((o) => {
      if (o.can <= 0 || o.i + 1 >= o.sorular.length) {
        oyunSkor('maraton', o.skor)
        return { ...o, bitti: true, i: o.i + 1 }
      }
      return { ...o, i: o.i + 1, secim: null }
    })
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1">
          {Array.from({ length: CAN }).map((_, i) => (
            <span key={i} className={cx('text-lg', i < oyun.can ? 'text-rose-500' : 'text-ink-300 dark:text-ink-700')}>
              ♥
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {oyun.seri >= 3 && (
            <span className="chip bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              <IconFlame size={12} /> {oyun.seri} seri
            </span>
          )}
          <span className="chip bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300">{oyun.skor} puan</span>
        </div>
      </div>

      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-400">
        {veri.adlar[soru.dersId] || ''} · {oyun.i + 1}. soru
      </p>

      <SoruKarti
        soru={soru}
        secili={oyun.secim}
        onCevap={cevapla}
        onSonraki={sonraki}
        kayitli={!!p.kayitlilar[soru.id]}
        onKayit={(id) => kayitToggle(id, soru.dersId)}
      />
    </>
  )
}
