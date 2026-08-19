import { useEffect } from 'react'
import { cx, yuzde } from '../lib/utils.js'
import { IconClose } from './Icons.jsx'

export function Yukleniyor({ satir = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: satir }).map((_, i) => (
        <div key={i} className="skeleton h-16 w-full" />
      ))}
    </div>
  )
}

export function Bos({ baslik, aciklama, ikon, aksiyon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink-200 px-6 py-14 text-center dark:border-white/10">
      {ikon && <div className="text-ink-300 dark:text-ink-600">{ikon}</div>}
      <p className="font-semibold">{baslik}</p>
      {aciklama && <p className="max-w-xs text-sm text-ink-500">{aciklama}</p>}
      {aksiyon}
    </div>
  )
}

export function Hata({ hata, yenile }) {
  return (
    <div className="card p-5 text-center">
      <p className="font-semibold text-red-600 dark:text-red-400">Veri yüklenemedi</p>
      <p className="mt-1 text-sm text-ink-500">{hata?.message || 'Bilinmeyen hata'}</p>
      {yenile && (
        <button className="btn-ghost mt-3" onClick={yenile}>
          Tekrar dene
        </button>
      )}
    </div>
  )
}

export function Ilerleme({ deger, toplam, renk = 'bg-brand-600', ince = false }) {
  const p = yuzde(deger, toplam)
  return (
    <div className={cx('w-full overflow-hidden rounded-full bg-ink-100 dark:bg-white/10', ince ? 'h-1.5' : 'h-2.5')}>
      <div className={cx('h-full rounded-full transition-all duration-500', renk)} style={{ width: `${p}%` }} />
    </div>
  )
}

export function Halka({ deger = 0, boyut = 92, kalinlik = 9, renk = '#1f49f0', alt }) {
  const r = (boyut - kalinlik) / 2
  const c = 2 * Math.PI * r
  const dash = (Math.min(100, Math.max(0, deger)) / 100) * c
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: boyut, height: boyut }}>
      <svg width={boyut} height={boyut} className="-rotate-90">
        <circle cx={boyut / 2} cy={boyut / 2} r={r} fill="none" strokeWidth={kalinlik} className="stroke-ink-100 dark:stroke-white/10" />
        <circle
          cx={boyut / 2}
          cy={boyut / 2}
          r={r}
          fill="none"
          strokeWidth={kalinlik}
          stroke={renk}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          style={{ transition: 'stroke-dasharray .6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold tabular-nums">%{Math.round(deger)}</span>
        {alt && <span className="text-[10px] text-ink-400">{alt}</span>}
      </div>
    </div>
  )
}

export function Istatistik({ etiket, deger, alt, renk = 'text-brand-600' }) {
  return (
    <div className="card p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">{etiket}</p>
      <p className={cx('mt-1 text-2xl font-extrabold tabular-nums', renk)}>{deger}</p>
      {alt && <p className="text-[11px] text-ink-400">{alt}</p>}
    </div>
  )
}

export function Modal({ acik, kapat, baslik, children, genis = false }) {
  useEffect(() => {
    if (!acik) return
    const h = (e) => e.key === 'Escape' && kapat?.()
    document.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', h)
      document.body.style.overflow = ''
    }
  }, [acik, kapat])

  if (!acik) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={kapat} />
      <div
        className={cx(
          'relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl animate-slideUp dark:bg-ink-900 sm:rounded-3xl',
          genis ? 'sm:max-w-2xl' : 'sm:max-w-md'
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold">{baslik}</h3>
          <button onClick={kapat} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-white/10" aria-label="Kapat">
            <IconClose size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Sekmeler({ sekmeler, aktif, degis }) {
  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-xl bg-ink-100 p-1 dark:bg-white/5">
      {sekmeler.map((s) => (
        <button
          key={s.id}
          onClick={() => degis(s.id)}
          className={cx(
            'flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition',
            aktif === s.id ? 'bg-white text-brand-700 shadow-sm dark:bg-ink-800 dark:text-brand-300' : 'text-ink-500 hover:text-ink-700 dark:hover:text-ink-300'
          )}
        >
          {s.ad}
          {s.sayi != null && <span className="ml-1.5 text-[11px] opacity-70">{s.sayi}</span>}
        </button>
      ))}
    </div>
  )
}

export function Rozet({ children, renk = 'brand' }) {
  const renkler = {
    brand: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300',
    yesil: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    kirmizi: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    turuncu: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    gri: 'bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-300',
  }
  return <span className={cx('chip', renkler[renk] || renkler.brand)}>{children}</span>
}
