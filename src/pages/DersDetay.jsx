import { useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getDers, getKonularByDers, getSorular, getNotlar } from '../lib/data.js'
import { useAsync, useProgress } from '../lib/hooks.js'
import { dersIstatistik, sifirlaDers } from '../lib/storage.js'
import { sayi, yuzde, cx } from '../lib/utils.js'
import { Yukleniyor, Hata, Ilerleme, Istatistik, Sekmeler, Bos, Modal } from '../components/UI.jsx'
import { Baslik } from '../components/Layout.jsx'
import { IconChevron, IconShuffle, IconCards, IconWrong, IconBookmark, IconRefresh, IconBook } from '../components/Icons.jsx'

export default function DersDetay() {
  const { dersId } = useParams()
  const nav = useNavigate()
  const p = useProgress()
  const [sekme, setSekme] = useState('konular')
  const [sifirlaAcik, setSifirlaAcik] = useState(false)

  const { veri, yukleniyor, hata, yenile } = useAsync(
    async () => {
      const [ders, konular, sorular, notlar] = await Promise.all([
        getDers(dersId),
        getKonularByDers(dersId),
        getSorular(dersId),
        getNotlar(dersId),
      ])
      return { ders, konular, sorular, anlatimli: new Set(notlar.map((n) => n.konuId)) }
    },
    [dersId]
  )

  const konuIst = useMemo(() => {
    if (!veri) return {}
    const m = {}
    for (const s of veri.sorular) {
      const k = (m[s.konuId] ||= { toplam: 0, cozulen: 0, dogru: 0 })
      k.toplam++
      const c = p.cozulen[s.id]
      if (c) {
        k.cozulen++
        if (c.d) k.dogru++
      }
    }
    return m
  }, [veri, p.cozulen])

  if (yukleniyor) return <Yukleniyor satir={6} />
  if (hata) return <Hata hata={hata} yenile={yenile} />
  if (!veri?.ders) return <Bos baslik="Ders bulunamadı" />

  const { ders, konular, sorular, anlatimli } = veri
  const ist = dersIstatistik(dersId)
  const dersYanlislar = sorular.filter((s) => p.yanlislar[s.id])
  const dersKayitlilar = sorular.filter((s) => p.kayitlilar[s.id])

  return (
    <>
      <Baslik
        baslik={ders.ad}
        altBaslik={`${sayi(ders.soruSayisi)} soru · ${konular.length} konu`}
        sag={
          <button onClick={() => setSifirlaAcik(true)} className="rounded-xl p-2 text-ink-400 hover:bg-ink-100 dark:hover:bg-white/10" title="İlerlemeyi sıfırla">
            <IconRefresh size={19} />
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-2.5">
        <Istatistik etiket="Çözülen" deger={sayi(ist.toplam)} />
        <Istatistik etiket="Doğru" deger={sayi(ist.dogru)} renk="text-emerald-600" />
        <Istatistik etiket="Başarı" deger={`%${ist.oran}`} renk="text-brand-600" />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <button className="btn-primary" onClick={() => nav(`/ders/${dersId}/konu/karisik`)}>
          <IconShuffle size={17} /> Karışık Çöz
        </button>
        <Link className="btn-ghost" to={`/kartlar/${dersId}`}>
          <IconCards size={17} /> Bilgi Kartları
        </Link>
        {anlatimli.size > 0 && (
          <Link className="btn-ghost col-span-2" to={`/ders/${dersId}/anlatim`}>
            <IconBook size={17} /> Konu Anlatımı ({anlatimli.size} konu)
          </Link>
        )}
      </div>

      <div className="mb-4">
        <Sekmeler
          aktif={sekme}
          degis={setSekme}
          sekmeler={[
            { id: 'konular', ad: 'Konular', sayi: konular.length },
            { id: 'yanlislar', ad: 'Yanlışlarım', sayi: dersYanlislar.length },
            { id: 'kayitlilar', ad: 'Kayıtlılar', sayi: dersKayitlilar.length },
          ]}
        />
      </div>

      {sekme === 'konular' && (
        <div className="space-y-2">
          {konular.map((k) => {
            const s = konuIst[k.id] || { toplam: 0, cozulen: 0, dogru: 0 }
            return (
              <Link
                key={k.id}
                to={`/ders/${dersId}/konu/${k.id}`}
                className={cx('card flex items-center gap-3 p-3.5 transition active:scale-[.99]', s.toplam === 0 && 'opacity-60')}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{k.ad}</p>
                  <p className="mt-0.5 text-[11px] text-ink-400">
                    {sayi(s.toplam)} soru
                    {s.cozulen > 0 && ` · ${s.cozulen} çözüldü · %${yuzde(s.dogru, s.cozulen)} doğru`}
                  </p>
                  <div className="mt-2">
                    <Ilerleme deger={s.cozulen} toplam={s.toplam || 1} ince />
                  </div>
                </div>
                {anlatimli.has(k.id) && (
                  <span
                    role="link"
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      nav(`/ders/${dersId}/anlatim/${k.id}`)
                    }}
                    className="shrink-0 rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-brand-600 dark:hover:bg-white/10"
                    title="Konu anlatımı"
                  >
                    <IconBook size={17} />
                  </span>
                )}
                <IconChevron size={18} className="shrink-0 text-ink-300" />
              </Link>
            )
          })}
          {konular.length === 0 && <Bos baslik="Bu derste henüz konu yok" />}
        </div>
      )}

      {sekme === 'yanlislar' &&
        (dersYanlislar.length ? (
          <ListeKisayol
            baslik={`${dersYanlislar.length} yanlış soru`}
            aciklama="Yanlış yaptığın soruları tekrar çöz."
            to={`/ders/${dersId}/konu/yanlislar`}
            Ikon={IconWrong}
          />
        ) : (
          <Bos baslik="Yanlışın yok" aciklama="Bu derste yanlış yaptığın soru bulunmuyor." ikon={<IconWrong size={34} />} />
        ))}

      {sekme === 'kayitlilar' &&
        (dersKayitlilar.length ? (
          <ListeKisayol
            baslik={`${dersKayitlilar.length} kayıtlı soru`}
            aciklama="Kaydettiğin soruları çöz."
            to={`/ders/${dersId}/konu/kayitlilar`}
            Ikon={IconBookmark}
          />
        ) : (
          <Bos baslik="Kayıtlı soru yok" aciklama="Soru çözerken yer imi simgesine dokunarak kaydedebilirsin." ikon={<IconBookmark size={34} />} />
        ))}

      <Modal acik={sifirlaAcik} kapat={() => setSifirlaAcik(false)} baslik="İlerlemeyi sıfırla">
        <p className="text-sm text-ink-500">
          <b>{ders.ad}</b> dersindeki tüm çözüm geçmişin ve yanlış kayıtların silinecek. Kayıtlı sorular ve notların korunur.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            className="btn-primary flex-1 !bg-red-600 hover:!bg-red-700"
            onClick={() => {
              sifirlaDers(dersId)
              setSifirlaAcik(false)
            }}
          >
            Sıfırla
          </button>
          <button className="btn-outline" onClick={() => setSifirlaAcik(false)}>
            Vazgeç
          </button>
        </div>
      </Modal>
    </>
  )
}

function ListeKisayol({ baslik, aciklama, to, Ikon }) {
  return (
    <Link to={to} className="card flex items-center gap-3.5 p-4 transition active:scale-[.99]">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
        <Ikon size={22} />
      </span>
      <div className="flex-1">
        <p className="text-sm font-bold">{baslik}</p>
        <p className="text-xs text-ink-400">{aciklama}</p>
      </div>
      <IconChevron size={18} className="text-ink-300" />
    </Link>
  )
}
