import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDeneme } from '../lib/data.js'
import { useAsync, useProgress } from '../lib/hooks.js'
import { cevapKaydet, denemeKaydet, kayitToggle } from '../lib/storage.js'
import { cx, sureFormat, yuzde, harf, ls } from '../lib/utils.js'
import { useSettings } from '../lib/settings.jsx'
import { net as netHesap, kpssPuan, DERS_REFERANS, PUAN_TURLERI, GRUPLAR } from '../lib/kpss.js'
import { Yukleniyor, Hata, Bos, Ilerleme, Istatistik, Modal, Rozet } from '../components/UI.jsx'
import SoruKarti from '../components/SoruKarti.jsx'
import Reklam from '../components/Reklam.jsx'
import { IconClose, IconClock, IconCheck, IconChevron, IconBack, IconTrophy } from '../components/Icons.jsx'

export default function DenemeCoz() {
  const { denemeId } = useParams()
  const nav = useNavigate()
  const p = useProgress()
  const { settings } = useSettings()

  const OTURUM_ANAHTARI = `ka:deneme-oturum:${denemeId}`

  // Yarım kalan sınav varsa geri yükle (sayfa yenilense de sınav kaybolmaz)
  const kayitliOturum = useMemo(() => {
    const o = ls.get(OTURUM_ANAHTARI, null)
    if (!o || !o.bitisZamani) return null
    if (o.bitisZamani <= Date.now()) {
      ls.sil(OTURUM_ANAHTARI) // süresi çoktan dolmuş
      return null
    }
    return o
  }, [denemeId]) // eslint-disable-line

  const [asama, setAsama] = useState(kayitliOturum ? 'sinav' : 'baslangic') // baslangic | sinav | sonuc
  const [i, setI] = useState(kayitliOturum?.i ?? 0)
  const [cevaplar, setCevaplar] = useState(kayitliOturum?.cevaplar ?? {}) // soruId -> secim
  const [isaretli, setIsaretli] = useState(kayitliOturum?.isaretli ?? {})
  // Sayaç duvar saatine bağlıdır: sekme arka plana atılsa da, tarayıcı zamanlayıcıyı
  // kıssa da kalan süre gerçek zamana göre hesaplanır.
  const [bitisZamani, setBitisZamani] = useState(kayitliOturum?.bitisZamani ?? 0)
  const [kalan, setKalan] = useState(() =>
    kayitliOturum ? Math.max(0, Math.round((kayitliOturum.bitisZamani - Date.now()) / 1000)) : 0
  )
  const [paletAcik, setPaletAcik] = useState(false)
  const [bitirAcik, setBitirAcik] = useState(false)
  const [sonuc, setSonuc] = useState(null)
  const timerRef = useRef(null)
  const bitirdiRef = useRef(false)

  const { veri, yukleniyor, hata, yenile } = useAsync(() => getDeneme(denemeId), [denemeId])

  const sorular = useMemo(() => {
    if (!veri) return []
    return (veri.bolumler || []).flatMap((b) => b.sorular.map((s) => ({ ...s, dersId: s.dersId || b.dersId, bolumAd: b.ad })))
  }, [veri])

  // Kalan süreyi duvar saatinden hesapla
  useEffect(() => {
    if (asama !== 'sinav' || !bitisZamani) return
    const guncelle = () => setKalan(Math.max(0, Math.round((bitisZamani - Date.now()) / 1000)))
    guncelle()
    timerRef.current = setInterval(guncelle, 1000)
    const gorunurlukDegisti = () => !document.hidden && guncelle()
    document.addEventListener('visibilitychange', gorunurlukDegisti)
    return () => {
      clearInterval(timerRef.current)
      document.removeEventListener('visibilitychange', gorunurlukDegisti)
    }
  }, [asama, bitisZamani])

  // Süre dolduğunda sınavı bitir (yalnızca bir kez)
  useEffect(() => {
    if (asama === 'sinav' && bitisZamani && kalan <= 0 && !bitirdiRef.current) bitir(true)
  }, [kalan, asama, bitisZamani]) // eslint-disable-line

  // Sınav durumunu sürekli sakla — sayfa yenilenirse kaldığı yerden devam eder
  useEffect(() => {
    if (asama !== 'sinav' || !bitisZamani) return
    ls.set(OTURUM_ANAHTARI, { bitisZamani, i, cevaplar, isaretli })
  }, [asama, bitisZamani, i, cevaplar, isaretli]) // eslint-disable-line

  // Sınav sırasında sekmeyi kapatmaya çalışırsa uyar
  useEffect(() => {
    if (asama !== 'sinav') return
    const uyar = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', uyar)
    return () => window.removeEventListener('beforeunload', uyar)
  }, [asama])

  if (yukleniyor) return <Yukleniyor satir={5} />
  if (hata) return <Hata hata={hata} yenile={yenile} />
  if (!veri || !sorular.length) return <Bos baslik="Deneme bulunamadı" />

  function basla() {
    const sn = (veri.sure || 60) * 60
    bitirdiRef.current = false
    setBitisZamani(Date.now() + sn * 1000)
    setKalan(sn)
    setAsama('sinav')
    setI(0)
  }

  function bitir(sureBitti = false) {
    if (bitirdiRef.current) return
    bitirdiRef.current = true
    clearInterval(timerRef.current)
    ls.sil(OTURUM_ANAHTARI)
    const detay = {}
    let dogru = 0
    let yanlis = 0
    for (const s of sorular) {
      const d = (detay[s.dersId] ||= { d: 0, y: 0, b: 0, toplam: 0 })
      d.toplam++
      const c = cevaplar[s.id]
      if (c == null) d.b++
      else if (c === s.dogru) {
        d.d++
        dogru++
        cevapKaydet({ soruId: s.id, dersId: s.dersId, konuId: s.konuId, dogruMu: true })
      } else {
        d.y++
        yanlis++
        cevapKaydet({ soruId: s.id, dersId: s.dersId, konuId: s.konuId, dogruMu: false })
      }
    }
    const bos = sorular.length - dogru - yanlis
    const toplamNet = Math.round(netHesap(dogru, yanlis) * 100) / 100

    const netler = {}
    for (const [dersId, d] of Object.entries(detay)) netler[dersId] = netHesap(d.d, d.y)

    // Deneme, puan türünün gerektirdiği tüm testleri kapsamıyorsa (branş denemeleri),
    // eksik derslerde aday ortalaması varsayılır — aksi hâlde puan yapay biçimde düşer.
    const puanTuru = veri.puanTuru || settings.puanTuru || 'P3'
    const gerekli = Object.keys(PUAN_TURLERI[puanTuru]?.agirlik || {}).flatMap((g) => GRUPLAR[g] || [])
    const eksik = gerekli.filter((d) => netler[d] == null)
    for (const d of eksik) netler[d] = DERS_REFERANS[d]?.ortalamaNet ?? 0
    const { puan } = kpssPuan(netler, puanTuru)

    const s = {
      denemeId,
      ad: veri.ad,
      dogru,
      yanlis,
      bos,
      net: toplamNet,
      puan,
      puanTuru,
      detay,
      varsayimliDersler: eksik.map((d) => DERS_REFERANS[d]?.ad || d),
      sureBitti,
      sureKullanilan: (veri.sure || 60) * 60 - kalan,
    }
    setSonuc(s)
    denemeKaydet(s)
    setAsama('sonuc')
    setBitirAcik(false)
  }

  /* --- Başlangıç ekranı --- */
  if (asama === 'baslangic') {
    return (
      <div className="mx-auto max-w-lg pt-4">
        <div className="card p-6 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15">
            <IconTrophy size={30} />
          </span>
          <h1 className="mt-4 text-xl font-extrabold">{veri.ad}</h1>
          <p className="mt-1 text-sm text-ink-500">{veri.aciklama || 'Gerçek sınav düzeninde deneme'}</p>
          <div className="mt-5 grid grid-cols-3 gap-2.5">
            <Istatistik etiket="Soru" deger={sorular.length} />
            <Istatistik etiket="Süre" deger={`${veri.sure} dk`} />
            <Istatistik etiket="Puan" deger={veri.puanTuru || settings.puanTuru} renk="text-violet-600" />
          </div>
          <ul className="mt-5 space-y-1.5 text-left text-xs text-ink-500">
            <li>• Sınav sırasında doğru cevap gösterilmez.</li>
            <li>• 4 yanlış 1 doğruyu götürür.</li>
            <li>• Süre dolduğunda sınav otomatik biter.</li>
          </ul>
          <button className="btn-primary mt-5 w-full !py-3.5 text-base" onClick={basla}>
            Denemeyi Başlat
          </button>
          <button className="btn-ghost mt-2 w-full" onClick={() => nav('/denemeler')}>
            Vazgeç
          </button>
        </div>
      </div>
    )
  }

  /* --- Sonuç ekranı --- */
  if (asama === 'sonuc' && sonuc) {
    return (
      <div className="mx-auto max-w-2xl pt-2">
        <div className="card mb-4 p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{sonuc.puanTuru} puanın (tahmini)</p>
          <p className="mt-1 text-5xl font-extrabold text-brand-600">{sonuc.puan.toFixed(3)}</p>
          <p className="mt-2 text-sm text-ink-500">
            Net <b>{sonuc.net}</b> · {sonuc.dogru} doğru, {sonuc.yanlis} yanlış, {sonuc.bos} boş
          </p>
          {sonuc.sureBitti && <p className="mt-2 text-xs font-semibold text-amber-500">Süre doldu</p>}
          {sonuc.varsayimliDersler?.length > 0 && (
            <p className="mx-auto mt-3 max-w-sm text-[11px] leading-relaxed text-ink-400">
              Bu deneme {sonuc.puanTuru} puanının tüm testlerini kapsamıyor. Puan hesaplanırken{' '}
              <b>{sonuc.varsayimliDersler.join(', ')}</b> derslerinde aday ortalaması kadar net yaptığın varsayıldı.
            </p>
          )}
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2.5">
          <Istatistik etiket="Doğru" deger={sonuc.dogru} renk="text-emerald-600" />
          <Istatistik etiket="Yanlış" deger={sonuc.yanlis} renk="text-red-500" />
          <Istatistik etiket="Süre" deger={sureFormat(sonuc.sureKullanilan)} renk="text-ink-500" />
        </div>

        <h2 className="section-title mb-2">Ders bazlı analiz</h2>
        <div className="mb-4 space-y-2">
          {Object.entries(sonuc.detay).map(([dersId, d]) => {
            const n = Math.round(netHesap(d.d, d.y) * 100) / 100
            return (
              <div key={dersId} className="card p-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">{DERS_REFERANS[dersId]?.ad || dersId}</p>
                  <p className="text-sm font-extrabold tabular-nums text-brand-600">{n} net</p>
                </div>
                <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
                  <div className="bg-emerald-500" style={{ width: `${yuzde(d.d, d.toplam)}%` }} />
                  <div className="bg-red-500" style={{ width: `${yuzde(d.y, d.toplam)}%` }} />
                </div>
                <p className="mt-1.5 text-[11px] text-ink-400">
                  {d.d} doğru · {d.y} yanlış · {d.b} boş · {d.toplam} soru
                </p>
              </div>
            )
          })}
        </div>

        <h2 className="section-title mb-2">Cevap anahtarı</h2>
        <div className="mb-4 grid grid-cols-5 gap-1.5 sm:grid-cols-10">
          {sorular.map((s, ix) => {
            const c = cevaplar[s.id]
            const durum = c == null ? 'bos' : c === s.dogru ? 'dogru' : 'yanlis'
            return (
              <div
                key={s.id}
                className={cx(
                  'rounded-lg px-1 py-1.5 text-center text-[11px] font-bold',
                  durum === 'dogru' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
                  durum === 'yanlis' && 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
                  durum === 'bos' && 'bg-ink-100 text-ink-500 dark:bg-white/10'
                )}
                title={`Doğru: ${harf(s.dogru)}`}
              >
                {ix + 1}
                <span className="ml-0.5 opacity-70">{c == null ? '–' : harf(c)}</span>
              </div>
            )
          })}
        </div>

        <Reklam yer="sonuc" />

        <div className="grid grid-cols-2 gap-2.5">
          <button
            className="btn-primary"
            onClick={() => {
              setCevaplar({})
              setIsaretli({})
              setSonuc(null)
              setAsama('baslangic')
            }}
          >
            Tekrar Çöz
          </button>
          <button className="btn-ghost" onClick={() => nav('/denemeler')}>
            Denemelere Dön
          </button>
        </div>
      </div>
    )
  }

  /* --- Sınav ekranı --- */
  const soru = sorular[i]
  const cevaplanan = Object.keys(cevaplar).length

  return (
    <div className="mx-auto max-w-2xl">
      <div className="sticky top-0 z-20 -mx-4 mb-4 flex items-center gap-2.5 border-b border-ink-100 bg-ink-50/90 px-4 py-2.5 backdrop-blur dark:border-white/5 dark:bg-ink-950/90">
        <button onClick={() => setBitirAcik(true)} className="rounded-xl p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-white/10" aria-label="Bitir">
          <IconClose size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold">{veri.ad}</p>
          <Ilerleme deger={cevaplanan} toplam={sorular.length} ince />
        </div>
        <span
          className={cx(
            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-extrabold tabular-nums',
            kalan < 300 ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300' : 'bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-200'
          )}
        >
          <IconClock size={15} /> {sureFormat(kalan)}
        </span>
        <button onClick={() => setPaletAcik(true)} className="btn-ghost !px-2.5 !py-1.5 !text-xs">
          {i + 1}/{sorular.length}
        </button>
      </div>

      {soru.bolumAd && <Rozet renk="gri">{soru.bolumAd}</Rozet>}

      <div className="mt-2">
        <SoruKarti
          soru={soru}
          sira={i + 1}
          toplam={sorular.length}
          mod="sinav"
          secili={cevaplar[soru.id] ?? null}
          onCevap={(secim) => setCevaplar((c) => ({ ...c, [soru.id]: secim }))}
          kayitli={!!p.kayitlilar[soru.id]}
          onKayit={(id) => kayitToggle(id, soru.dersId)}
          isaretli={!!isaretli[soru.id]}
          onIsaret={(id) => setIsaretli((m) => ({ ...m, [id]: !m[id] }))}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button className="btn-outline flex-1" onClick={() => setI((x) => Math.max(0, x - 1))} disabled={i === 0}>
          <IconBack size={16} /> Önceki
        </button>
        <button
          className="btn-ghost"
          onClick={() =>
            setCevaplar((c) => {
              const n = { ...c }
              delete n[soru.id]
              return n
            })
          }
        >
          Temizle
        </button>
        {i < sorular.length - 1 ? (
          <button className="btn-primary flex-1" onClick={() => setI((x) => x + 1)}>
            Sonraki <IconChevron size={16} />
          </button>
        ) : (
          <button className="btn-primary flex-1" onClick={() => setBitirAcik(true)}>
            <IconCheck size={16} /> Bitir
          </button>
        )}
      </div>

      <Modal acik={paletAcik} kapat={() => setPaletAcik(false)} baslik="Sorular" genis>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
          {sorular.map((s, ix) => {
            const cev = cevaplar[s.id] != null
            return (
              <button
                key={s.id}
                onClick={() => {
                  setI(ix)
                  setPaletAcik(false)
                }}
                className={cx(
                  'relative rounded-lg py-2 text-xs font-bold transition',
                  ix === i && 'ring-2 ring-brand-500',
                  cev ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-300'
                )}
              >
                {ix + 1}
                {isaretli[s.id] && <span className="absolute -right-0.5 -top-0.5 text-amber-400">★</span>}
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-ink-400">
          {cevaplanan} cevaplandı · {sorular.length - cevaplanan} boş
        </p>
      </Modal>

      <Modal acik={bitirAcik} kapat={() => setBitirAcik(false)} baslik="Sınavı bitir">
        <p className="text-sm text-ink-500">
          {sorular.length - cevaplanan > 0
            ? `${sorular.length - cevaplanan} soru boş. Yine de bitirmek istiyor musun?`
            : 'Tüm soruları cevapladın. Sınavı bitirelim mi?'}
        </p>
        <div className="mt-4 flex gap-2">
          <button className="btn-primary flex-1" onClick={() => bitir(false)}>
            Bitir ve Sonucu Gör
          </button>
          <button className="btn-outline" onClick={() => setBitirAcik(false)}>
            Devam et
          </button>
        </div>
      </Modal>
    </div>
  )
}
