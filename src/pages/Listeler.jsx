import { useState } from 'react'
import { getSorularByIdler, getDersler } from '../lib/data.js'
import { useAsync, useProgress } from '../lib/hooks.js'
import { kayitToggle, notKaydet, cevapKaydet, cozumTemizle, idDersCiftleri } from '../lib/storage.js'
import { tarihFormat } from '../lib/utils.js'
import { Yukleniyor, Hata, Bos, Modal } from '../components/UI.jsx'
import { Baslik, TemaButonu } from '../components/Layout.jsx'
import SoruKarti from '../components/SoruKarti.jsx'
import { IconWrong, IconBookmark, IconNote, IconRefresh, IconChevron } from '../components/Icons.jsx'

const META = {
  yanlislar: { baslik: 'Yanlışlarım', bos: 'Yanlış yaptığın soru yok', Ikon: IconWrong },
  kayitlilar: { baslik: 'Kayıtlılar', bos: 'Kaydettiğin soru yok', Ikon: IconBookmark },
  notlar: { baslik: 'Notlarım', bos: 'Henüz not almadın', Ikon: IconNote },
}

export default function Listeler({ tur }) {
  const p = useProgress()
  const meta = META[tur]
  const ciftler = idDersCiftleri(tur)
  const idler = ciftler.map((c) => c.id)

  const [cozModu, setCozModu] = useState(false)
  const [i, setI] = useState(0)
  const [cevaplar, setCevaplar] = useState({})
  const [temizleAcik, setTemizleAcik] = useState(false)

  const { veri, yukleniyor, hata, yenile } = useAsync(async () => {
    const [sorular, dersler] = await Promise.all([getSorularByIdler(ciftler), getDersler()])
    return { sorular, adlar: Object.fromEntries(dersler.map((d) => [d.id, d.ad])) }
  }, [idler.join(',')])

  if (yukleniyor) return <Yukleniyor satir={5} />
  if (hata) return <Hata hata={hata} yenile={yenile} />

  const sorular = veri?.sorular || []

  if (!sorular.length)
    return (
      <>
        <Baslik baslik={meta.baslik} geri={false} sag={<TemaButonu />} />
        <Bos baslik={meta.bos} aciklama="Soru çözerken bu listeye ekleme yapabilirsin." ikon={<meta.Ikon size={34} />} />
      </>
    )

  if (cozModu) {
    const soru = sorular[i]
    return (
      <>
        <Baslik
          baslik={meta.baslik}
          altBaslik={`${i + 1} / ${sorular.length}`}
          sag={
            <button className="btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => setCozModu(false)}>
              Listeye dön
            </button>
          }
        />
        <SoruKarti
          soru={soru}
          sira={i + 1}
          toplam={sorular.length}
          secili={cevaplar[soru.id]?.secim}
          onCevap={(secim, dogruMu) => {
            setCevaplar((c) => ({ ...c, [soru.id]: { secim, dogru: dogruMu } }))
            cevapKaydet({ soruId: soru.id, dersId: soru.dersId, konuId: soru.konuId, dogruMu })
          }}
          onSonraki={() => setI((x) => Math.min(sorular.length - 1, x + 1))}
          kayitli={!!p.kayitlilar[soru.id]}
          onKayit={(id) => kayitToggle(id, soru.dersId)}
          not={p.notlar[soru.id]}
          onNot={(id, m) => notKaydet(id, m, soru.dersId)}
        />
        <div className="mt-4 flex gap-2">
          <button className="btn-outline flex-1" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>
            Önceki
          </button>
          <button className="btn-ghost flex-1" onClick={() => setI((x) => Math.min(sorular.length - 1, x + 1))} disabled={i >= sorular.length - 1}>
            Sonraki
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      <Baslik
        baslik={meta.baslik}
        altBaslik={`${sorular.length} soru`}
        geri={false}
        sag={
          <div className="flex items-center gap-1">
            {tur === 'yanlislar' && (
              <button onClick={() => setTemizleAcik(true)} className="rounded-xl p-2 text-ink-400 hover:bg-ink-100 dark:hover:bg-white/10" title="Listeyi temizle">
                <IconRefresh size={19} />
              </button>
            )}
            <TemaButonu />
          </div>
        }
      />

      <button
        className="btn-primary mb-4 w-full"
        onClick={() => {
          setI(0)
          setCozModu(true)
        }}
      >
        Tümünü Çöz ({sorular.length})
      </button>

      <div className="space-y-2">
        {sorular.map((s, ix) => (
          <button
            key={s.id}
            onClick={() => {
              setI(ix)
              setCozModu(true)
            }}
            className="card flex w-full items-start gap-3 p-3.5 text-left transition active:scale-[.99]"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ink-100 text-[11px] font-bold text-ink-500 dark:bg-white/10">
              {ix + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm">{s.soru}</p>
              <p className="mt-1 text-[11px] text-ink-400">{veri.adlar[s.dersId] || s.dersId}</p>
              {tur === 'notlar' && p.notlar[s.id] && (
                <p className="mt-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                  {p.notlar[s.id].metin}
                  <span className="ml-1.5 opacity-60">· {tarihFormat(p.notlar[s.id].t)}</span>
                </p>
              )}
            </div>
            <IconChevron size={16} className="mt-1 shrink-0 text-ink-300" />
          </button>
        ))}
      </div>

      <Modal acik={temizleAcik} kapat={() => setTemizleAcik(false)} baslik="Yanlışları temizle">
        <p className="text-sm text-ink-500">Bu listedeki tüm sorular yanlışlar listesinden çıkarılacak. Çözüm geçmişin de sıfırlanır.</p>
        <div className="mt-4 flex gap-2">
          <button
            className="btn-primary flex-1 !bg-red-600 hover:!bg-red-700"
            onClick={() => {
              idler.forEach(cozumTemizle)
              setTemizleAcik(false)
            }}
          >
            Temizle
          </button>
          <button className="btn-outline" onClick={() => setTemizleAcik(false)}>
            Vazgeç
          </button>
        </div>
      </Modal>
    </>
  )
}
