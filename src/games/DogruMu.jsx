import { useEffect, useState } from 'react'
import { getDogruMu } from '../lib/data.js'
import { useAsync } from '../lib/hooks.js'
import { oyunSkor } from '../lib/storage.js'
import { karistir, cx } from '../lib/utils.js'
import { Yukleniyor, Hata, Bos, Ilerleme } from '../components/UI.jsx'
import { IconCheck, IconWrong, IconRefresh, IconTrophy } from '../components/Icons.jsx'

const ADET = 12
const SANIYE = 12

export default function DogruMu() {
  const { veri, yukleniyor, hata, yenile } = useAsync(getDogruMu, [])
  const [oyun, setOyun] = useState(null)
  const [kalan, setKalan] = useState(SANIYE)

  useEffect(() => {
    if (!oyun || oyun.bitti || oyun.sonuc) return
    if (kalan <= 0) {
      cevapla(null)
      return
    }
    const t = setTimeout(() => setKalan((k) => k - 1), 1000)
    return () => clearTimeout(t)
  }, [kalan, oyun?.i, oyun?.sonuc, oyun?.bitti]) // eslint-disable-line

  function basla() {
    setOyun({ ifadeler: karistir(veri).slice(0, ADET), i: 0, skor: 0, sonuc: null, bitti: false })
    setKalan(SANIYE)
  }

  if (yukleniyor) return <Yukleniyor satir={4} />
  if (hata) return <Hata hata={hata} yenile={yenile} />
  if (!veri?.length) return <Bos baslik="Veri bulunamadı" />

  if (!oyun) {
    return (
      <div className="card p-6 text-center">
        <IconTrophy size={34} className="mx-auto text-violet-500" />
        <h2 className="mt-2 text-lg font-extrabold">Doğru mu?</h2>
        <p className="mt-1 text-sm text-ink-500">
          Ekrandaki bilgi doğru mu yanlış mı? Her soru için {SANIYE} saniyen var. Hızlı cevap daha çok puan.
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
          <IconTrophy size={34} className="mx-auto text-violet-500" />
          <p className="mt-2 text-4xl font-extrabold text-violet-500">{oyun.skor}</p>
          <p className="text-sm text-ink-500">{ADET} ifadede toplam puan</p>
        </div>
        <button className="btn-primary mt-3 w-full" onClick={basla}>
          <IconRefresh size={17} /> Tekrar Oyna
        </button>
      </>
    )
  }

  const ifade = oyun.ifadeler[oyun.i]

  function cevapla(secim) {
    if (oyun.sonuc) return
    const dogruMu = secim === ifade.dogru
    const kazanc = dogruMu ? 10 + Math.max(0, kalan) : 0
    setOyun((o) => ({ ...o, sonuc: { secim, dogruMu, kazanc }, skor: o.skor + kazanc }))
  }

  function sonraki() {
    setOyun((o) => {
      if (o.i + 1 >= o.ifadeler.length) {
        oyunSkor('dogrumu', o.skor)
        return { ...o, bitti: true }
      }
      return { ...o, i: o.i + 1, sonuc: null }
    })
    setKalan(SANIYE)
  }

  return (
    <>
      <div className="mb-3 flex items-center gap-3">
        <Ilerleme deger={oyun.i + 1} toplam={oyun.ifadeler.length} ince renk="bg-violet-600" />
        <span className="shrink-0 text-xs font-bold tabular-nums text-ink-400">
          {oyun.i + 1}/{oyun.ifadeler.length}
        </span>
        <span className="chip bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">{oyun.skor}</span>
      </div>

      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
        <div
          className={cx('h-full rounded-full transition-all duration-1000 ease-linear', kalan <= 3 ? 'bg-red-500' : 'bg-violet-600')}
          style={{ width: `${(kalan / SANIYE) * 100}%` }}
        />
      </div>

      <div className="card mb-4 flex min-h-[10rem] items-center justify-center p-6">
        <p className="text-center text-lg font-semibold leading-relaxed">{ifade.ifade}</p>
      </div>

      {!oyun.sonuc ? (
        <div className="grid grid-cols-2 gap-2.5">
          <button className="btn bg-emerald-600 py-4 text-base text-white hover:bg-emerald-700" onClick={() => cevapla(true)}>
            <IconCheck size={20} /> Doğru
          </button>
          <button className="btn bg-red-600 py-4 text-base text-white hover:bg-red-700" onClick={() => cevapla(false)}>
            <IconWrong size={20} /> Yanlış
          </button>
        </div>
      ) : (
        <>
          <div
            className={cx(
              'rounded-xl p-4 text-sm',
              oyun.sonuc.dogruMu
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
                : 'bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-300'
            )}
          >
            <p className="font-bold">
              {oyun.sonuc.secim == null ? 'Süre doldu!' : oyun.sonuc.dogruMu ? `Doğru! +${oyun.sonuc.kazanc}` : 'Yanlış'}
              {' — ifade '}
              {ifade.dogru ? 'DOĞRU' : 'YANLIŞ'}
            </p>
            {ifade.aciklama && <p className="mt-1.5 leading-relaxed opacity-90">{ifade.aciklama}</p>}
          </div>
          <button className="btn-primary mt-3 w-full" onClick={sonraki}>
            Devam
          </button>
        </>
      )}
    </>
  )
}
