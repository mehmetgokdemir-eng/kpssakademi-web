import { useEffect, useState } from 'react'
import { getEslestirme } from '../lib/data.js'
import { useAsync } from '../lib/hooks.js'
import { oyunSkor } from '../lib/storage.js'
import { karistir, cx, sureFormat } from '../lib/utils.js'
import { Yukleniyor, Hata, Bos } from '../components/UI.jsx'
import { IconRefresh, IconTrophy } from '../components/Icons.jsx'

const CIFT = 6

export default function Eslestirme() {
  const { veri, yukleniyor, hata, yenile } = useAsync(getEslestirme, [])
  const [oyun, setOyun] = useState(null)
  const [sure, setSure] = useState(0)

  useEffect(() => {
    if (!oyun || oyun.bitti) return
    const i = setInterval(() => setSure((s) => s + 1), 1000)
    return () => clearInterval(i)
  }, [oyun?.tur, oyun?.bitti]) // eslint-disable-line

  function basla() {
    const secilen = karistir(veri).slice(0, CIFT)
    setSure(0)
    setOyun({
      ciftler: secilen,
      sol: karistir(secilen.map((c, i) => ({ id: i, metin: c.sol }))),
      sag: karistir(secilen.map((c, i) => ({ id: i, metin: c.sag }))),
      seciliSol: null,
      eslesen: [],
      hata: 0,
      yanlisCift: null,
      bitti: false,
      tur: Date.now(),
    })
  }

  if (yukleniyor) return <Yukleniyor satir={4} />
  if (hata) return <Hata hata={hata} yenile={yenile} />
  if (!veri?.length) return <Bos baslik="Eşleştirme verisi bulunamadı" />

  if (!oyun) {
    return (
      <div className="card p-6 text-center">
        <IconTrophy size={34} className="mx-auto text-sky-500" />
        <h2 className="mt-2 text-lg font-extrabold">Eşleştirme</h2>
        <p className="mt-1 text-sm text-ink-500">Soldaki kavramı sağdaki karşılığıyla eşleştir. Ne kadar hızlı, o kadar çok puan.</p>
        <button className="btn-primary mt-4 w-full" onClick={basla}>
          Başla
        </button>
      </div>
    )
  }

  if (oyun.bitti) {
    const puan = Math.max(10, 300 - sure * 3 - oyun.hata * 15)
    return (
      <>
        <div className="card p-6 text-center">
          <IconTrophy size={34} className="mx-auto text-sky-500" />
          <p className="mt-2 text-4xl font-extrabold text-sky-500">{puan}</p>
          <p className="text-sm text-ink-500">
            {sureFormat(sure)} · {oyun.hata} hata
          </p>
        </div>
        <button className="btn-primary mt-3 w-full" onClick={basla}>
          <IconRefresh size={17} /> Tekrar Oyna
        </button>
      </>
    )
  }

  function sagSec(s) {
    if (oyun.seciliSol == null) return
    if (oyun.eslesen.includes(s.id)) return
    if (s.id === oyun.seciliSol) {
      const eslesen = [...oyun.eslesen, s.id]
      const bitti = eslesen.length === oyun.ciftler.length
      setOyun((o) => ({ ...o, eslesen, seciliSol: null, bitti }))
      if (bitti) {
        const puan = Math.max(10, 300 - sure * 3 - oyun.hata * 15)
        oyunSkor('eslestirme', puan)
      }
    } else {
      setOyun((o) => ({ ...o, hata: o.hata + 1, yanlisCift: s.id }))
      setTimeout(() => setOyun((o) => ({ ...o, yanlisCift: null, seciliSol: null })), 500)
    }
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between text-xs font-bold text-ink-400">
        <span>
          {oyun.eslesen.length}/{oyun.ciftler.length} eşleşti
        </span>
        <span className="tabular-nums">
          {sureFormat(sure)} · {oyun.hata} hata
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-2">
          {oyun.sol.map((s) => {
            const tamam = oyun.eslesen.includes(s.id)
            return (
              <button
                key={`l${s.id}`}
                disabled={tamam}
                onClick={() => setOyun((o) => ({ ...o, seciliSol: s.id }))}
                className={cx(
                  'w-full rounded-xl border p-3 text-left text-xs font-semibold transition',
                  tamam
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 opacity-60 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : oyun.seciliSol === s.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                      : 'border-ink-200 dark:border-white/10'
                )}
              >
                {s.metin}
              </button>
            )
          })}
        </div>
        <div className="space-y-2">
          {oyun.sag.map((s) => {
            const tamam = oyun.eslesen.includes(s.id)
            return (
              <button
                key={`r${s.id}`}
                disabled={tamam}
                onClick={() => sagSec(s)}
                className={cx(
                  'w-full rounded-xl border p-3 text-left text-xs transition',
                  tamam
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 opacity-60 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : oyun.yanlisCift === s.id
                      ? 'border-red-400 bg-red-50 dark:border-red-500/50 dark:bg-red-500/10'
                      : 'border-ink-200 dark:border-white/10'
                )}
              >
                {s.metin}
              </button>
            )
          })}
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] text-ink-400">Önce soldan bir kavram, sonra sağdan karşılığını seç.</p>
    </>
  )
}
