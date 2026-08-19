import { useState } from 'react'
import { getKronoloji } from '../lib/data.js'
import { useAsync } from '../lib/hooks.js'
import { oyunSkor } from '../lib/storage.js'
import { karistir, cx } from '../lib/utils.js'
import { Yukleniyor, Hata, Bos } from '../components/UI.jsx'
import { IconRefresh, IconTrophy, IconCheck, IconWrong } from '../components/Icons.jsx'

const TUR_UZUNLUK = 5
const TUR_SAYISI = 5

export default function Kronoloji() {
  const { veri, yukleniyor, hata, yenile } = useAsync(getKronoloji, [])
  const [tur, setTur] = useState(null)

  function basla() {
    const havuz = karistir(veri)
    const turlar = []
    for (let i = 0; i < TUR_SAYISI && (i + 1) * TUR_UZUNLUK <= havuz.length; i++) {
      turlar.push(karistir(havuz.slice(i * TUR_UZUNLUK, (i + 1) * TUR_UZUNLUK)))
    }
    setTur({ turlar, t: 0, secim: [], skor: 0, kontrol: null, bitti: false })
  }

  if (yukleniyor) return <Yukleniyor satir={4} />
  if (hata) return <Hata hata={hata} yenile={yenile} />
  if (!veri?.length) return <Bos baslik="Kronoloji verisi bulunamadı" />

  if (!tur) {
    return (
      <div className="card p-6 text-center">
        <IconTrophy size={34} className="mx-auto text-amber-500" />
        <h2 className="mt-2 text-lg font-extrabold">Kronoloji</h2>
        <p className="mt-1 text-sm text-ink-500">
          Karışık verilen olayları <b>en eskiden en yeniye</b> doğru sırayla seç. {TUR_SAYISI} tur, her turda {TUR_UZUNLUK} olay.
        </p>
        <button className="btn-primary mt-4 w-full" onClick={basla}>
          Başla
        </button>
      </div>
    )
  }

  if (tur.bitti) {
    return (
      <>
        <div className="card p-6 text-center">
          <IconTrophy size={34} className="mx-auto text-amber-500" />
          <p className="mt-2 text-4xl font-extrabold text-amber-500">{tur.skor}</p>
          <p className="text-sm text-ink-500">
            {tur.turlar.length * TUR_UZUNLUK} olayda {tur.skor} doğru sıralama
          </p>
        </div>
        <button className="btn-primary mt-3 w-full" onClick={basla}>
          <IconRefresh size={17} /> Tekrar Oyna
        </button>
      </>
    )
  }

  const olaylar = tur.turlar[tur.t]
  const dogruSira = [...olaylar].sort((a, b) => a.yil - b.yil)

  function sec(o) {
    if (tur.kontrol) return
    if (tur.secim.includes(o)) return
    const yeniSecim = [...tur.secim, o]
    if (yeniSecim.length === olaylar.length) {
      const dogruSayisi = yeniSecim.filter((x, i) => x.yil === dogruSira[i].yil).length
      setTur((t) => ({ ...t, secim: yeniSecim, kontrol: { dogruSayisi } , skor: t.skor + dogruSayisi }))
    } else {
      setTur((t) => ({ ...t, secim: yeniSecim }))
    }
  }

  function sonrakiTur() {
    setTur((t) => {
      const yeniT = t.t + 1
      if (yeniT >= t.turlar.length) {
        oyunSkor('kronoloji', t.skor)
        return { ...t, bitti: true }
      }
      return { ...t, t: yeniT, secim: [], kontrol: null }
    })
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold text-ink-400">
          Tur {tur.t + 1}/{tur.turlar.length}
        </span>
        <span className="chip bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">{tur.skor} puan</span>
      </div>

      <p className="mb-3 text-sm text-ink-500">Eskiden yeniye doğru sırayla dokun.</p>

      <div className="space-y-2">
        {olaylar.map((o, i) => {
          const sira = tur.secim.indexOf(o)
          const dogruYer = tur.kontrol ? dogruSira.indexOf(o) : -1
          const dogruMu = tur.kontrol && sira === dogruYer
          return (
            <button
              key={i}
              onClick={() => sec(o)}
              disabled={!!tur.kontrol}
              className={cx(
                'flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition',
                tur.kontrol
                  ? dogruMu
                    ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-500/50 dark:bg-emerald-500/10'
                    : 'border-red-400 bg-red-50 dark:border-red-500/50 dark:bg-red-500/10'
                  : sira >= 0
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                    : 'border-ink-200 dark:border-white/10'
              )}
            >
              <span
                className={cx(
                  'grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold',
                  sira >= 0 ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-400 dark:bg-white/10'
                )}
              >
                {sira >= 0 ? sira + 1 : '?'}
              </span>
              <span className="flex-1">{o.ad}</span>
              {tur.kontrol && (
                <span className="flex shrink-0 items-center gap-1 text-xs font-bold">
                  {o.yil}
                  {dogruMu ? <IconCheck size={15} className="text-emerald-600" /> : <IconWrong size={15} className="text-red-500" />}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {tur.kontrol && (
        <>
          <div className="mt-3 rounded-xl bg-ink-100 p-3 text-center text-sm font-semibold dark:bg-white/5">
            {tur.kontrol.dogruSayisi}/{olaylar.length} doğru yerde
          </div>
          <button className="btn-primary mt-2.5 w-full" onClick={sonrakiTur}>
            {tur.t + 1 >= tur.turlar.length ? 'Sonucu Gör' : 'Sonraki Tur'}
          </button>
        </>
      )}

      {!tur.kontrol && tur.secim.length > 0 && (
        <button className="btn-ghost mt-3 w-full" onClick={() => setTur((t) => ({ ...t, secim: [] }))}>
          Seçimi Temizle
        </button>
      )}
    </>
  )
}
