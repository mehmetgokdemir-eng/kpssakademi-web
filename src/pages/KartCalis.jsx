import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getDers, getDersler, getKartlar } from '../lib/data.js'
import { useAsync, useProgress } from '../lib/hooks.js'
import { kartIsaretle } from '../lib/storage.js'
import { karistir, cx, sayi, etiketAyir } from '../lib/utils.js'
import { useSettings } from '../lib/settings.jsx'
import { oku, durdur } from '../lib/tts.js'
import { Yukleniyor, Hata, Bos, Ilerleme, Rozet } from '../components/UI.jsx'
import { Baslik } from '../components/Layout.jsx'
import { IconSpeaker, IconCheck, IconShuffle, IconRefresh, IconChevron, IconBack } from '../components/Icons.jsx'

/** "tar_ilk_turk" → "İlk Türk" gibi okunabilir bir etiket üretir. */
function kartKonuAdi(id) {
  const govde = String(id).replace(/^[a-z]{2,4}_/, '').replace(/_/g, ' ')
  return govde.charAt(0).toLocaleUpperCase('tr') + govde.slice(1)
}

export default function KartCalis() {
  const { dersId } = useParams()
  const { settings } = useSettings()
  const p = useProgress()
  const [i, setI] = useState(0)
  const [cevrik, setCevrik] = useState(false)
  const [konuFiltre, setKonuFiltre] = useState('hepsi')
  const [karisikMi, setKarisikMi] = useState(dersId === 'karisik')
  const [tohum, setTohum] = useState(0)

  const { veri, yukleniyor, hata, yenile } = useAsync(async () => {
    if (dersId === 'karisik') {
      const dersler = await getDersler()
      const listeler = await Promise.all(dersler.filter((d) => d.kartSayisi).map((d) => getKartlar(d.id).catch(() => [])))
      return { ders: { ad: 'Karışık Kartlar' }, kartlar: listeler.flat(), konular: [] }
    }
    const [ders, kartlar] = await Promise.all([getDers(dersId), getKartlar(dersId)])
    /* Kartların konuId şeması, soruların/Models.kt'nin şemasından farklı
       (ör. kart "tar_ilk_turk", soru "i_lk_turk_devletleri"). Bu yüzden filtre
       listesi ders konularından değil, kartların kendi konuId'lerinden üretilir;
       aksi hâlde her filtre boş çıkardı. */
    const sayac = new Map()
    for (const k of kartlar) if (k.konuId) sayac.set(k.konuId, (sayac.get(k.konuId) || 0) + 1)
    const konular = [...sayac.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, n]) => ({ id, ad: kartKonuAdi(id) + ` (${n})` }))
    return { ders, kartlar, konular }
  }, [dersId])

  const kartlar = useMemo(() => {
    if (!veri) return []
    let liste = veri.kartlar
    if (konuFiltre !== 'hepsi') liste = liste.filter((k) => k.konuId === konuFiltre)
    return karisikMi ? karistir(liste) : liste
  }, [veri, konuFiltre, karisikMi, tohum])

  useEffect(() => {
    setI(0)
    setCevrik(false)
  }, [konuFiltre, karisikMi, tohum])

  useEffect(() => () => durdur(), [])

  if (yukleniyor) return <Yukleniyor satir={4} />
  if (hata) return <Hata hata={hata} yenile={yenile} />
  if (!kartlar.length)
    return (
      <>
        <Baslik baslik="Bilgi Kartları" altBaslik={veri?.ders?.ad} />
        <Bos baslik="Kart bulunamadı" />
      </>
    )

  const kart = kartlar[i]
  const bilinen = !!p.kartlar[kart.id]?.bilinen
  const { metin: arkaMetin, etiketler } = etiketAyir(kart.arka || '')

  const ilerle = (adim) => {
    durdur()
    setCevrik(false)
    setI((x) => Math.min(kartlar.length - 1, Math.max(0, x + adim)))
  }

  return (
    <>
      <Baslik
        baslik={veri.ders?.ad || 'Kartlar'}
        altBaslik={`${sayi(kartlar.length)} kart`}
        sag={
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setKarisikMi((v) => !v)
                setTohum((t) => t + 1)
              }}
              className={cx('rounded-xl p-2 hover:bg-ink-100 dark:hover:bg-white/10', karisikMi ? 'text-brand-600' : 'text-ink-400')}
              title="Karıştır"
            >
              <IconShuffle size={19} />
            </button>
            <button
              onClick={() => setTohum((t) => t + 1)}
              className="rounded-xl p-2 text-ink-400 hover:bg-ink-100 dark:hover:bg-white/10"
              title="Baştan başla"
            >
              <IconRefresh size={19} />
            </button>
          </div>
        }
      />

      {veri.konular?.length > 0 && (
        <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
          <FiltreDugme aktif={konuFiltre === 'hepsi'} onClick={() => setKonuFiltre('hepsi')}>
            Tümü
          </FiltreDugme>
          {veri.konular.map((k) => (
            <FiltreDugme key={k.id} aktif={konuFiltre === k.id} onClick={() => setKonuFiltre(k.id)}>
              {k.ad}
            </FiltreDugme>
          ))}
        </div>
      )}

      <div className="mb-3 flex items-center gap-3">
        <Ilerleme deger={i + 1} toplam={kartlar.length} ince />
        <span className="shrink-0 text-xs font-semibold tabular-nums text-ink-400">
          {i + 1}/{kartlar.length}
        </span>
      </div>

      <div className="perspective mb-4">
        <button
          onClick={() => setCevrik((v) => !v)}
          className="relative block h-[22rem] w-full text-left preserve-3d transition-transform duration-500 sm:h-[24rem]"
          style={{ transform: cevrik ? 'rotateY(180deg)' : 'none' }}
          aria-label="Kartı çevir"
        >
          {/* Ön yüz */}
          <div className="absolute inset-0 backface-hidden">
            <div className="flex h-full flex-col justify-between rounded-3xl bg-gradient-to-br from-brand-600 to-brand-900 p-6 text-white shadow-lift">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">{kart.konuAd || veri.ders?.ad}</span>
              <p className="text-center text-xl font-bold leading-relaxed sm:text-2xl">{kart.on}</p>
              <span className="text-center text-[11px] opacity-70">Çevirmek için dokun</span>
            </div>
          </div>
          {/* Arka yüz */}
          <div className="absolute inset-0 rotate-y-180 backface-hidden">
            <div className="flex h-full flex-col justify-between overflow-y-auto rounded-3xl border border-ink-200 bg-white p-6 shadow-card dark:border-white/10 dark:bg-ink-900">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Cevap</span>
              <p className="whitespace-pre-line text-center text-base font-medium leading-relaxed sm:text-lg">{arkaMetin}</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {etiketler.map((e) => (
                  <Rozet key={e} renk="gri">
                    {e}
                  </Rozet>
                ))}
              </div>
            </div>
          </div>
        </button>
      </div>

      <div className="mb-3 flex items-center justify-center gap-2">
        {settings.tts && (
          <button
            className="btn-ghost"
            onClick={(e) => {
              e.stopPropagation()
              oku(cevrik ? arkaMetin : kart.on, { hiz: settings.ttsHiz })
            }}
          >
            <IconSpeaker size={17} /> Sesli Oku
          </button>
        )}
        <button
          className={cx('btn', bilinen ? 'bg-emerald-600 text-white' : 'btn-ghost')}
          onClick={() => {
            kartIsaretle(kart.id, !bilinen)
            if (!bilinen) setTimeout(() => ilerle(1), 250)
          }}
        >
          <IconCheck size={17} /> {bilinen ? 'Tamamlandı' : 'Tamamdır'}
        </button>
      </div>

      <div className="flex gap-2">
        <button className="btn-outline flex-1" onClick={() => ilerle(-1)} disabled={i === 0}>
          <IconBack size={16} /> Önceki
        </button>
        <button className="btn-primary flex-1" onClick={() => ilerle(1)} disabled={i >= kartlar.length - 1}>
          Sonraki <IconChevron size={16} />
        </button>
      </div>
    </>
  )
}

function FiltreDugme({ aktif, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
        aktif ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 dark:bg-white/5 dark:text-ink-300'
      )}
    >
      {children}
    </button>
  )
}
