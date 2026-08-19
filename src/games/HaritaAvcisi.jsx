import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import { getHarita } from '../lib/data.js'
import { useAsync, useProgress } from '../lib/hooks.js'
import { oyunSkor } from '../lib/storage.js'
import { karistir, cx } from '../lib/utils.js'
import { Yukleniyor, Hata, Bos, Ilerleme, Sekmeler } from '../components/UI.jsx'
import { IconTrophy, IconRefresh, IconTarget } from '../components/Icons.jsx'

const SORU_SAYISI = 8

/** SVG piksel koordinatını enlem/boylama çevirir (harita verisindeki sınırlara göre) */
function pikselToKonum(x, y, veri) {
  const [, , g, yuk] = veri.viewBox.split(/\s+/).map(Number)
  const s = veri.sinirlar
  return {
    lon: s.lonMin + (x / g) * (s.lonMax - s.lonMin),
    lat: s.latMax - (y / yuk) * (s.latMax - s.latMin),
  }
}

/** İki nokta arasındaki gerçek yüzey mesafesi (km) */
function mesafeKm(a, b) {
  const R = 6371
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

export default function HaritaAvcisi() {
  const { veri, yukleniyor, hata, yenile } = useAsync(getHarita, [])
  const p = useProgress()
  const [kategoriId, setKategoriId] = useState(null)
  const [mod, setMod] = useState('oyun') // oyun | ezber
  const [tur, setTur] = useState(null) // { ogeler, i, skor, tahmin, gecmis }
  const svgRef = useRef(null)

  const kategori = useMemo(() => {
    if (!veri) return null
    return veri.kategoriler.find((k) => k.id === kategoriId) || null
  }, [veri, kategoriId])

  useEffect(() => {
    if (kategori && mod === 'oyun') basla()
  }, [kategori?.id, mod]) // eslint-disable-line

  function basla() {
    if (!kategori) return
    setTur({
      ogeler: karistir(kategori.ogeler).slice(0, Math.min(SORU_SAYISI, kategori.ogeler.length)),
      i: 0,
      skor: 0,
      tahmin: null,
      gecmis: [],
    })
  }

  if (yukleniyor) return <Yukleniyor satir={4} />
  if (hata) return <Hata hata={hata} yenile={yenile} />
  if (!veri?.kategoriler?.length) return <Bos baslik="Harita verisi bulunamadı" />

  /* --- Kategori seçimi --- */
  if (!kategori) {
    return (
      <>
        <p className="mb-3 text-sm text-ink-500">Bir kategori seç, haritada konumları bul.</p>
        <div className="grid grid-cols-2 gap-2.5">
          {veri.kategoriler.map((k) => {
            const s = p.oyun[`harita:${k.id}`]
            return (
              <button
                key={k.id}
                onClick={() => setKategoriId(k.id)}
                className="card p-3.5 text-left transition active:scale-[.97]"
              >
                <p className="text-sm font-bold">{k.ad}</p>
                <p className="mt-0.5 text-[11px] text-ink-400">{k.ogeler.length} konum</p>
                {s && (
                  <p className="mt-1.5 text-[11px] font-semibold text-emerald-600">
                    En iyi {s.enIyi} · {s.oynanan} kez
                  </p>
                )}
              </button>
            )
          })}
        </div>
      </>
    )
  }

  const oge = tur?.ogeler[tur.i]
  const bitti = tur && tur.i >= tur.ogeler.length

  function tikla(e) {
    if (mod !== 'oyun' || !oge || tur.tahmin) return
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const { x, y } = pt.matrixTransform(svg.getScreenCTM().inverse())
    // Piksel → enlem/boylam → gerçek km sapması (haversine)
    const km = oge.lat != null ? mesafeKm(pikselToKonum(x, y, veri), oge) : Math.hypot(x - oge.x, y - oge.y) * 1.6
    const puan = Math.max(0, Math.round(100 - km / 4)) // 400 km ve ötesi 0 puan
    setTur((t) => ({ ...t, tahmin: { x, y, km, puan } }))
  }

  function sonraki() {
    setTur((t) => {
      const yeniSkor = t.skor + (t.tahmin?.puan || 0)
      const gecmis = [...t.gecmis, { ad: oge.ad, puan: t.tahmin?.puan || 0 }]
      const yeni = { ...t, i: t.i + 1, skor: yeniSkor, tahmin: null, gecmis }
      if (yeni.i >= t.ogeler.length) {
        oyunSkor('harita', yeniSkor)
        oyunSkor(`harita:${kategori.id}`, yeniSkor)
      }
      return yeni
    })
  }

  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <button className="btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => setKategoriId(null)}>
          ← Kategoriler
        </button>
        <div className="flex-1" />
        <Sekmeler
          aktif={mod}
          degis={setMod}
          sekmeler={[
            { id: 'oyun', ad: 'Oyun' },
            { id: 'ezber', ad: 'Ezber' },
          ]}
        />
      </div>

      <h2 className="mb-2 text-base font-extrabold">{kategori.ad}</h2>

      {mod === 'oyun' && tur && !bitti && (
        <>
          <div className="mb-2 flex items-center gap-3">
            <Ilerleme deger={tur.i + (tur.tahmin ? 1 : 0)} toplam={tur.ogeler.length} ince renk="bg-emerald-600" />
            <span className="shrink-0 text-xs font-bold tabular-nums text-ink-400">
              {tur.i + 1}/{tur.ogeler.length}
            </span>
            <span className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">{tur.skor} puan</span>
          </div>
          <div className="card mb-3 flex items-center gap-2.5 p-3">
            <IconTarget size={20} className="shrink-0 text-emerald-600" />
            <p className="text-sm">
              <b>{oge.ad}</b> nerede? Haritada işaretle.
            </p>
          </div>
        </>
      )}

      <Harita
        ref={svgRef}
        veri={veri}
        onClick={tikla}
        isaretler={
          mod === 'ezber'
            ? kategori.ogeler.map((o) => ({ ...o, etiketli: true, renk: '#1baf7a' }))
            : tur?.tahmin
              ? [
                  { ...oge, etiketli: true, renk: '#1baf7a' },
                  { ad: 'Tahminin', x: tur.tahmin.x, y: tur.tahmin.y, renk: '#e34948' },
                ]
              : []
        }
        cizgi={tur?.tahmin ? { x1: tur.tahmin.x, y1: tur.tahmin.y, x2: oge.x, y2: oge.y } : null}
        tiklanabilir={mod === 'oyun' && !!oge && !tur?.tahmin}
      />

      {mod === 'ezber' && (
        <>
          <p className="mt-3 text-xs text-ink-400">
            Tüm konumlar haritada işaretli. Ezberledikten sonra <b>Oyun</b> sekmesine geç.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {kategori.ogeler.map((o) => (
              <span key={o.ad} className="chip bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-300">
                {o.ad}
              </span>
            ))}
          </div>
        </>
      )}

      {mod === 'oyun' && tur?.tahmin && !bitti && (
        <div className="mt-3">
          <div
            className={cx(
              'rounded-xl p-3.5 text-center text-sm font-semibold',
              tur.tahmin.puan > 70
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                : tur.tahmin.puan > 35
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                  : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
            )}
          >
            {tur.tahmin.puan > 70 ? 'Çok iyi!' : tur.tahmin.puan > 35 ? 'Yaklaştın' : 'Uzak'} · +{tur.tahmin.puan} puan
            <span className="ml-1 font-normal opacity-80">(~{Math.round(tur.tahmin.km)} km sapma)</span>
          </div>
          {oge.bilgi && (
            <div className="card mt-2.5 p-3.5">
              <p className="text-sm font-bold">{oge.ad}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-500 dark:text-ink-300">{oge.bilgi}</p>
              {oge.wiki && (
                <a
                  href={`https://tr.wikipedia.org/wiki/${encodeURIComponent(oge.wiki.replace(/ /g, '_'))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-semibold text-brand-600 dark:text-brand-400"
                >
                  Vikipedi'de oku →
                </a>
              )}
            </div>
          )}
          <button className="btn-primary mt-2.5 w-full" onClick={sonraki}>
            Devam
          </button>
        </div>
      )}

      {mod === 'oyun' && bitti && (
        <div className="mt-4">
          <div className="card p-6 text-center">
            <IconTrophy size={34} className="mx-auto text-emerald-600" />
            <p className="mt-2 text-4xl font-extrabold text-emerald-600">{tur.skor}</p>
            <p className="text-sm text-ink-500">
              {tur.ogeler.length} konumda toplam puan · en fazla {tur.ogeler.length * 100}
            </p>
          </div>
          <div className="mt-3 space-y-1.5">
            {tur.gecmis.map((g, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-ink-100 px-3 py-2 text-sm dark:bg-white/5">
                <span>{g.ad}</span>
                <b className="tabular-nums">{g.puan}</b>
              </div>
            ))}
          </div>
          <button className="btn-primary mt-3 w-full" onClick={basla}>
            <IconRefresh size={17} /> Tekrar Oyna
          </button>
        </div>
      )}
    </>
  )
}

const Harita = forwardRef(function Harita({ veri, onClick, isaretler = [], cizgi, tiklanabilir }, ref) {
  return (
    <div className={cx('card overflow-hidden p-2', tiklanabilir && 'cursor-crosshair')}>
      <svg ref={ref} viewBox={veri.viewBox} className="w-full touch-manipulation" onClick={onClick} role="img" aria-label="Türkiye haritası">
        <path d={veri.path} className="fill-ink-100 stroke-ink-300 dark:fill-white/5 dark:stroke-white/20" strokeWidth="2" strokeLinejoin="round" />
        {veri.marmara && (
          <path d={veri.marmara} className="fill-brand-200/70 stroke-brand-300/60 dark:fill-brand-500/20 dark:stroke-brand-400/30" strokeWidth="1.5" />
        )}
        {cizgi && <line {...cizgi} stroke="#898781" strokeWidth="2" strokeDasharray="6 5" />}
        {isaretler.map((m, i) => (
          <g key={i}>
            <circle cx={m.x} cy={m.y} r="8" fill={m.renk || '#2a78d6'} stroke="#ffffff" strokeWidth="2" />
            {m.etiketli && (
              <text x={m.x} y={m.y - 13} textAnchor="middle" fontSize="13" fontWeight="700" className="fill-ink-900 dark:fill-white">
                {m.ad}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
})
