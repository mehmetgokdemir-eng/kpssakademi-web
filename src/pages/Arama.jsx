import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDersler, getSorular } from '../lib/data.js'
import { useProgress } from '../lib/hooks.js'
import { cx, sayi } from '../lib/utils.js'
import { Bos, Rozet, Yukleniyor } from '../components/UI.jsx'
import { Baslik } from '../components/Layout.jsx'
import { IconSearch, IconClose, IconCheck, IconWrong } from '../components/Icons.jsx'

/* Soru Arama — Android'deki SoruAramaActivity'nin karşılığı.
 *
 * 16.066 sorunun tamamı 16 MB; hepsini indirip aramak mobilde kabul edilemez.
 * Bu yüzden arama DERS SEÇİMİNE bağlı: seçilen dersin dosyası (en büyüğü
 * 3,6 MB, çoğu 300–600 KB) bir kez indirilip bellekte tutulur, sonraki
 * aramalar anında çalışır. "Tüm dersler" seçeneği bilinçli olarak yok.
 *
 * DİKKAT — Türkçe küçültme: 'İ'.toLowerCase() birleşik nokta üretir ve
 * eşleşmeyi bozar. Karşılaştırma öncesi harfler elle eşlenir. */

const TR = { İ: 'i', I: 'i', Ş: 's', Ğ: 'g', Ü: 'u', Ö: 'o', Ç: 'c', ı: 'i', ş: 's', ğ: 'g', ü: 'u', ö: 'o', ç: 'c' }
const norm = (s) =>
  String(s || '')
    .replace(/[İIŞĞÜÖÇışğüöç]/g, (c) => TR[c] || c)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

const ZORLUKLAR = [
  ['hepsi', 'Tümü'],
  ['kolay', 'Kolay'],
  ['orta', 'Orta'],
  ['zor', 'Zor'],
]

/** Eşleşen parçayı vurgular. */
function Vurgu({ metin, terim }) {
  if (!terim) return <>{metin}</>
  const n = norm(metin)
  const i = n.indexOf(terim)
  if (i < 0) return <>{metin}</>
  return (
    <>
      {metin.slice(0, i)}
      <mark className="rounded bg-amber-200 px-0.5 text-ink-900 dark:bg-amber-400/40 dark:text-white">
        {metin.slice(i, i + terim.length)}
      </mark>
      {metin.slice(i + terim.length)}
    </>
  )
}

export default function Arama() {
  const p = useProgress()
  const [dersler, setDersler] = useState([])
  const [dersId, setDersId] = useState('')
  const [sorgu, setSorgu] = useState('')
  const [zorluk, setZorluk] = useState('hepsi')
  const [durum, setDurum] = useState('') // '' | 'yukleniyor' | 'hazir'
  const havuz = useRef([])
  const girdiRef = useRef(null)

  useEffect(() => {
    getDersler().then(setDersler).catch(() => {})
  }, [])

  useEffect(() => {
    if (!dersId) return
    let iptal = false
    setDurum('yukleniyor')
    getSorular(dersId)
      .then((liste) => {
        if (iptal) return
        havuz.current = liste.map((s) => ({ ...s, _n: norm(s.soru) }))
        setDurum('hazir')
        girdiRef.current?.focus()
      })
      .catch(() => !iptal && setDurum('hazir'))
    return () => {
      iptal = true
    }
  }, [dersId])

  const terim = norm(sorgu)
  const sonuclar = useMemo(() => {
    if (durum !== 'hazir') return []
    if (terim.length < 3 && zorluk === 'hepsi') return []
    let liste = havuz.current
    if (zorluk !== 'hepsi') liste = liste.filter((s) => (s.zorluk || 'orta') === zorluk)
    if (terim.length >= 3) liste = liste.filter((s) => s._n.includes(terim))
    return liste.slice(0, 80)
  }, [terim, zorluk, durum, dersId])

  const ders = dersler.find((d) => d.id === dersId)

  return (
    <>
      <Baslik baslik="Soru Arama" altBaslik="Soru bankasında metin ve zorluk araması" />

      {!dersId ? (
        <>
          <p className="mb-3 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
            Önce bir ders seç. Soru bankası 16 MB olduğu için arama ders ders yapılır; seçtiğin dersin
            soruları bir kez indirilir, sonrası anında çalışır.
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {dersler.map((d) => (
              <button
                key={d.id}
                onClick={() => setDersId(d.id)}
                className="card p-3 text-left transition hover:border-brand-400"
              >
                <p className="text-sm font-bold leading-tight">{d.ad}</p>
                <p className="mt-0.5 text-[11px] text-ink-400">{sayi(d.soruSayisi)} soru</p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2">
            <button onClick={() => setDersId('')} className="btn-ghost !px-3 !py-2 !text-xs">
              {ders?.ad} <IconClose size={14} />
            </button>
            <div className="relative flex-1">
              <IconSearch size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                ref={girdiRef}
                className="input !pl-9"
                placeholder="En az 3 harf yaz…"
                value={sorgu}
                onChange={(e) => setSorgu(e.target.value)}
              />
            </div>
          </div>

          <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto pb-1">
            {ZORLUKLAR.map(([id, ad]) => (
              <button
                key={id}
                onClick={() => setZorluk(id)}
                className={cx(
                  'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
                  zorluk === id ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 dark:bg-white/5 dark:text-ink-300'
                )}
              >
                {ad}
              </button>
            ))}
          </div>

          {durum === 'yukleniyor' && <Yukleniyor satir={4} />}

          {durum === 'hazir' && terim.length < 3 && zorluk === 'hepsi' && (
            <Bos baslik="Aramaya başla" aciklama="En az 3 harf yaz ya da bir zorluk seç." />
          )}

          {durum === 'hazir' && (terim.length >= 3 || zorluk !== 'hepsi') && (
            <>
              <p className="mb-2 text-xs font-semibold text-ink-400">
                {sonuclar.length === 80 ? 'İlk 80 sonuç' : `${sayi(sonuclar.length)} sonuç`}
              </p>
              {!sonuclar.length && <Bos baslik="Sonuç yok" aciklama="Farklı bir kelime veya zorluk dene." />}
              <div className="space-y-2.5">
                {sonuclar.map((s) => {
                  const c = p.cozulen[s.id]
                  return (
                    <Link
                      key={s.id}
                      to={`/ders/${s.dersId}/konu/${s.konuId}?soru=${s.id}`}
                      className="card block p-3.5 transition hover:border-brand-400"
                    >
                      <p className="text-[14px] font-medium leading-relaxed">
                        <Vurgu metin={s.soru} terim={terim.length >= 3 ? terim : ''} />
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Rozet renk="gri">{s.zorluk || 'orta'}</Rozet>
                        {c &&
                          (c.d ? (
                            <Rozet renk="yesil">
                              <IconCheck size={11} /> doğru çözüldü
                            </Rozet>
                          ) : (
                            <Rozet renk="kirmizi">
                              <IconWrong size={11} /> yanlış çözüldü
                            </Rozet>
                          ))}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
