import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getDers, getKonularByDers, getSorular, getNotlar } from '../lib/data.js'
import { useAsync, useProgress, useSureOlcer } from '../lib/hooks.js'
import { cevapKaydet, kayitToggle, notKaydet, getState } from '../lib/storage.js'
import { karistir, sayi, yuzde } from '../lib/utils.js'
import { useSettings } from '../lib/settings.jsx'
import { Yukleniyor, Hata, Bos, Ilerleme, Istatistik } from '../components/UI.jsx'
import { Baslik } from '../components/Layout.jsx'
import SoruKarti from '../components/SoruKarti.jsx'
import { IconRefresh, IconShuffle, IconBook } from '../components/Icons.jsx'

const OZEL = { karisik: 'Karışık', yanlislar: 'Yanlışlarım', kayitlilar: 'Kayıtlılar' }

export default function SoruCoz() {
  const { dersId, konuId } = useParams()
  const nav = useNavigate()
  const { settings } = useSettings()
  const p = useProgress()
  const { sifirla, gecen } = useSureOlcer()

  const [i, setI] = useState(0)
  const [cevaplar, setCevaplar] = useState({}) // soruId -> {secim, dogru}
  const [bitti, setBitti] = useState(false)
  const otoTimer = useRef(null)

  const { veri, yukleniyor, hata, yenile } = useAsync(
    async () => {
      const [ders, konular, tumSorular, notlar] = await Promise.all([
        getDers(dersId),
        getKonularByDers(dersId),
        getSorular(dersId),
        getNotlar(dersId),
      ])
      const anlatimVar = notlar.some((n) => n.konuId === konuId)
      const konuAdlari = Object.fromEntries(konular.map((k) => [k.id, k.ad]))
      const s = getState()
      let liste
      if (konuId === 'karisik') liste = karistir(tumSorular)
      else if (konuId === 'yanlislar') liste = tumSorular.filter((x) => s.yanlislar[x.id])
      else if (konuId === 'kayitlilar') liste = tumSorular.filter((x) => s.kayitlilar[x.id])
      else liste = tumSorular.filter((x) => x.konuId === konuId)
      return {
        ders,
        anlatimVar,
        baslik: OZEL[konuId] || konuAdlari[konuId] || 'Sorular',
        sorular: liste.map((x) => ({ ...x, konuAd: konuAdlari[x.konuId] })),
      }
    },
    [dersId, konuId]
  )

  useEffect(() => () => clearTimeout(otoTimer.current), [])
  useEffect(() => {
    sifirla()
  }, [i, sifirla])

  const sorular = veri?.sorular || []
  const soru = sorular[i]
  const cevaplanan = Object.keys(cevaplar).length
  const dogruSayisi = Object.values(cevaplar).filter((c) => c.dogru).length

  const sonraki = () => {
    clearTimeout(otoTimer.current)
    if (i + 1 >= sorular.length) setBitti(true)
    else setI((x) => x + 1)
  }

  const cevapla = (secim, dogruMu) => {
    if (cevaplar[soru.id]) return
    setCevaplar((c) => ({ ...c, [soru.id]: { secim, dogru: dogruMu } }))
    cevapKaydet({ soruId: soru.id, dersId, konuId: soru.konuId, dogruMu, sureSn: gecen() })
    if (settings.otomatikSonraki) otoTimer.current = setTimeout(sonraki, dogruMu ? 900 : 2200)
  }

  const yenidenBasla = () => {
    setCevaplar({})
    setI(0)
    setBitti(false)
  }

  if (yukleniyor) return <Yukleniyor satir={5} />
  if (hata) return <Hata hata={hata} yenile={yenile} />
  if (!sorular.length)
    return (
      <>
        <Baslik baslik={veri?.baslik || 'Sorular'} altBaslik={veri?.ders?.ad} />
        <Bos baslik="Bu listede soru yok" aciklama="Farklı bir konu seçebilir ya da karışık modda çözebilirsin." />
      </>
    )

  if (bitti) {
    const oran = yuzde(dogruSayisi, cevaplanan || 1)
    return (
      <>
        <Baslik baslik="Sonuç" altBaslik={`${veri.ders?.ad} · ${veri.baslik}`} />
        <div className="card mb-4 p-6 text-center">
          <p className="text-5xl font-extrabold text-brand-600">%{oran}</p>
          <p className="mt-1 text-sm text-ink-500">
            {cevaplanan} soruda {dogruSayisi} doğru
          </p>
        </div>
        <div className="mb-4 grid grid-cols-3 gap-2.5">
          <Istatistik etiket="Doğru" deger={dogruSayisi} renk="text-emerald-600" />
          <Istatistik etiket="Yanlış" deger={cevaplanan - dogruSayisi} renk="text-red-500" />
          <Istatistik etiket="Boş" deger={sorular.length - cevaplanan} renk="text-ink-400" />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button className="btn-primary" onClick={yenidenBasla}>
            <IconRefresh size={17} /> Tekrar Çöz
          </button>
          <button className="btn-ghost" onClick={() => nav(`/ders/${dersId}`)}>
            Derse Dön
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <Baslik
        baslik={veri.baslik}
        altBaslik={`${veri.ders?.ad} · ${sayi(sorular.length)} soru`}
        sag={
          veri.anlatimVar ? (
            <Link
              to={`/ders/${dersId}/anlatim/${konuId}`}
              className="rounded-xl p-2 text-ink-400 hover:bg-ink-100 hover:text-brand-600 dark:hover:bg-white/10"
              title="Konu anlatımı"
            >
              <IconBook size={19} />
            </Link>
          ) : konuId !== 'karisik' ? null : (
            <button onClick={yenidenBasla} className="rounded-xl p-2 text-ink-400 hover:bg-ink-100 dark:hover:bg-white/10" title="Yeniden karıştır">
              <IconShuffle size={19} />
            </button>
          )
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <Ilerleme deger={i + 1} toplam={sorular.length} ince />
        <span className="shrink-0 text-xs font-semibold tabular-nums text-ink-400">
          {i + 1}/{sorular.length}
        </span>
      </div>

      <SoruKarti
        soru={soru}
        sira={i + 1}
        toplam={sorular.length}
        secili={cevaplar[soru.id]?.secim}
        onCevap={cevapla}
        onSonraki={sonraki}
        kayitli={!!p.kayitlilar[soru.id]}
        onKayit={(id) => kayitToggle(id, dersId)}
        not={p.notlar[soru.id]}
        onNot={(id, m) => notKaydet(id, m, dersId)}
      />

      {!cevaplar[soru.id] && (
        <div className="mt-4 flex gap-2">
          <button className="btn-ghost flex-1" onClick={sonraki}>
            Boş Bırak / Geç
          </button>
          {i > 0 && (
            <button className="btn-outline" onClick={() => setI((x) => x - 1)}>
              Önceki
            </button>
          )}
        </div>
      )}

    </>
  )
}
