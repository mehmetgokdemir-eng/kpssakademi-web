import { useState } from 'react'
import { useSettings } from '../lib/settings.jsx'
import { KROM, seriRenk } from '../lib/palette.js'
import { sayi, cx } from '../lib/utils.js'

const useKrom = () => {
  const { theme } = useSettings()
  const koyu = theme === 'dark'
  return { koyu, k: koyu ? KROM.koyu : KROM.acik }
}

/**
 * Yatay bar — kategorik karşılaştırma (ders dağılımı).
 * Her barın yanında ad + değer doğrudan yazılır; kimlik hiçbir zaman
 * yalnızca renkle taşınmaz.
 */
export function YatayBar({ veri, birim = '', bosMetin = 'Henüz veri yok' }) {
  const { koyu } = useKrom()
  if (!veri?.length) return <p className="py-6 text-center text-sm text-ink-400">{bosMetin}</p>
  const enBuyuk = Math.max(...veri.map((d) => d.deger), 1)

  return (
    <ul className="space-y-2.5">
      {veri.map((d, i) => (
        <li key={d.ad}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2 text-xs font-semibold">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.renk || seriRenk(i, koyu) }} aria-hidden />
              <span className="truncate">{d.ad}</span>
            </span>
            <span className="shrink-0 text-xs font-bold tabular-nums text-ink-500 dark:text-ink-300">
              {sayi(d.deger)}
              {birim}
              {d.altDeger != null && <span className="ml-1 font-medium text-ink-400">· %{d.altDeger}</span>}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
            <div
              className="h-full rounded-r-[4px] transition-all duration-700"
              style={{ width: `${Math.max(2, (d.deger / enBuyuk) * 100)}%`, background: d.renk || seriRenk(i, koyu) }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * Dikey bar — tek seri, zaman içindeki değişim (son N gün).
 * Tek seri olduğu için efsane (legend) yok; başlık seriyi adlandırır.
 */
export function DikeyBar({ veri, yukseklik = 148, renkIndeks = 0, etiketBicim = (d) => d.etiket }) {
  const { koyu, k } = useKrom()
  const [uzerinde, setUzerinde] = useState(null)
  if (!veri?.length) return null
  const enBuyuk = Math.max(...veri.map((d) => d.deger), 1)
  const renk = seriRenk(renkIndeks, koyu)

  return (
    <div className="relative">
      <div className="flex items-end gap-1.5" style={{ height: yukseklik }}>
        {veri.map((d, i) => {
          const h = Math.max(3, (d.deger / enBuyuk) * (yukseklik - 22))
          return (
            <button
              key={i}
              className="group flex flex-1 flex-col items-center justify-end gap-1.5 outline-none"
              onMouseEnter={() => setUzerinde(i)}
              onMouseLeave={() => setUzerinde(null)}
              onFocus={() => setUzerinde(i)}
              onBlur={() => setUzerinde(null)}
              aria-label={`${d.etiket}: ${d.deger}`}
            >
              <span
                className={cx('w-full rounded-t-[4px] transition-all duration-500', uzerinde === i && 'opacity-80')}
                style={{ height: h, background: renk, minWidth: 6 }}
              />
              <span className="text-[10px] font-semibold text-ink-400">{etiketBicim(d)}</span>
            </button>
          )
        })}
      </div>
      {uzerinde != null && (
        <div
          className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold shadow-card"
          style={{ background: k.yuzey, color: k.mürekkep, border: `1px solid ${k.izgara}` }}
        >
          {veri[uzerinde].etiket}: <b>{sayi(veri[uzerinde].deger)}</b>
          {veri[uzerinde].alt && <span className="ml-1 font-normal text-ink-400">{veri[uzerinde].alt}</span>}
        </div>
      )}
    </div>
  )
}

/**
 * Çizgi — tek seri eğilim (deneme puanları).
 * 2px çizgi, 8px işaretçi, geri planda soluk ızgara.
 */
export function Cizgi({ veri, yukseklik = 160, renkIndeks = 0, yBirim = '' }) {
  const { koyu, k } = useKrom()
  const [uzerinde, setUzerinde] = useState(null)
  if (!veri || veri.length < 2) return <p className="py-6 text-center text-sm text-ink-400">Eğilim için en az 2 kayıt gerekli</p>

  const W = 320
  const H = yukseklik
  const pad = { ust: 12, alt: 22, sol: 30, sag: 10 }
  const degerler = veri.map((d) => d.deger)
  const min = Math.min(...degerler)
  const max = Math.max(...degerler)
  const araligi = max - min || 1
  const altSinir = min - araligi * 0.15
  const ustSinir = max + araligi * 0.15
  const x = (i) => pad.sol + (i / (veri.length - 1)) * (W - pad.sol - pad.sag)
  const y = (v) => pad.ust + (1 - (v - altSinir) / (ustSinir - altSinir)) * (H - pad.ust - pad.alt)
  const renk = seriRenk(renkIndeks, koyu)
  const d = veri.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.deger).toFixed(1)}`).join(' ')

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Puan eğilimi">
        {[0, 0.5, 1].map((t) => {
          const v = altSinir + t * (ustSinir - altSinir)
          return (
            <g key={t}>
              <line x1={pad.sol} x2={W - pad.sag} y1={y(v)} y2={y(v)} stroke={k.izgara} strokeWidth="1" />
              <text x={pad.sol - 5} y={y(v) + 3} textAnchor="end" fontSize="8" fill={k.soluk}>
                {v.toFixed(0)}
              </text>
            </g>
          )
        })}
        <path d={d} fill="none" stroke={renk} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {veri.map((p, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.deger)} r={uzerinde === i ? 5.5 : 4} fill={renk} stroke={k.yuzey} strokeWidth="2" />
            <rect
              x={x(i) - 12}
              y={pad.ust}
              width="24"
              height={H - pad.ust - pad.alt}
              fill="transparent"
              onMouseEnter={() => setUzerinde(i)}
              onMouseLeave={() => setUzerinde(null)}
            />
          </g>
        ))}
        {veri.map((p, i) =>
          i === 0 || i === veri.length - 1 ? (
            <text key={`e${i}`} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : 'end'} fontSize="8" fill={k.soluk}>
              {p.etiket}
            </text>
          ) : null
        )}
      </svg>
      {uzerinde != null && (
        <div
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold shadow-card"
          style={{ background: k.yuzey, color: k.mürekkep, border: `1px solid ${k.izgara}` }}
        >
          {veri[uzerinde].etiket}: <b>{veri[uzerinde].deger.toFixed(1)}{yBirim}</b>
        </div>
      )}
    </div>
  )
}
