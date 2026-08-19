import { useEffect, useRef, useState } from 'react'
import { cx } from '../lib/utils.js'
import { IconCalc, IconNote, IconClose, IconRefresh, IconBack } from './Icons.jsx'

/* Sınav araçları — Android'deki KaralamaPaneli ve HesapMakinesiOverlay'in
 * karşılığı. Soru çözme, quiz ve deneme ekranlarında sağ altta duran iki
 * düğme; sınav sırasında sayfayı terk etmeden hesap ve karalama yapılır.
 *
 * Karalama tuvali cihazın piksel yoğunluğuna göre ölçeklenir, yoksa çizgi
 * bulanık çıkar. Boyut değişiminde içerik korunur. */

/* ── Hesap makinesi ─────────────────────────────────────────── */
function Hesap() {
  const [ekran, setEkran] = useState('0')
  const [onceki, setOnceki] = useState(null)
  const [islem, setIslem] = useState(null)
  const [yeni, setYeni] = useState(true)

  const rakam = (d) => {
    if (yeni) {
      setEkran(d === ',' ? '0,' : d)
      setYeni(false)
    } else {
      if (d === ',' && ekran.includes(',')) return
      setEkran(ekran === '0' && d !== ',' ? d : ekran + d)
    }
  }
  const sayi = (s) => parseFloat(String(s).replace(',', '.')) || 0
  const yaz = (n) => {
    if (!isFinite(n)) return 'Tanımsız'
    const s = Math.round(n * 1e10) / 1e10
    return String(s).replace('.', ',')
  }
  const uygula = (a, b, op) => (op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : op === '÷' ? a / b : b)

  const islemBas = (op) => {
    const d = sayi(ekran)
    if (onceki != null && islem && !yeni) {
      const sonuc = uygula(onceki, d, islem)
      setOnceki(sonuc)
      setEkran(yaz(sonuc))
    } else {
      setOnceki(d)
    }
    setIslem(op)
    setYeni(true)
  }
  const esittir = () => {
    if (onceki == null || !islem) return
    const sonuc = uygula(onceki, sayi(ekran), islem)
    setEkran(yaz(sonuc))
    setOnceki(null)
    setIslem(null)
    setYeni(true)
  }
  const temizle = () => {
    setEkran('0')
    setOnceki(null)
    setIslem(null)
    setYeni(true)
  }
  const geriSil = () => {
    if (yeni) return
    setEkran(ekran.length > 1 ? ekran.slice(0, -1) : '0')
  }

  const T = ({ children, onClick, tip = 'sayi', genis }) => (
    <button
      onClick={onClick}
      className={cx(
        'rounded-xl py-3 text-lg font-bold transition active:scale-95',
        genis && 'col-span-2',
        tip === 'islem'
          ? 'bg-brand-600 text-white'
          : tip === 'ozel'
            ? 'bg-ink-200 text-ink-700 dark:bg-white/10 dark:text-ink-200'
            : 'bg-ink-100 text-ink-800 dark:bg-white/5 dark:text-ink-100'
      )}
    >
      {children}
    </button>
  )

  return (
    <div>
      <div className="mb-2 rounded-xl bg-ink-900 px-4 py-3 text-right dark:bg-black/40">
        <p className="truncate text-3xl font-extrabold tabular-nums text-white">{ekran}</p>
        <p className="h-4 text-[11px] text-white/50">{onceki != null && islem ? `${yaz(onceki)} ${islem}` : ''}</p>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <T tip="ozel" onClick={temizle}>C</T>
        <T tip="ozel" onClick={geriSil}><IconBack size={17} /></T>
        <T tip="ozel" onClick={() => setEkran(yaz(sayi(ekran) / 100))}>%</T>
        <T tip="islem" onClick={() => islemBas('÷')}>÷</T>
        {['7', '8', '9'].map((d) => <T key={d} onClick={() => rakam(d)}>{d}</T>)}
        <T tip="islem" onClick={() => islemBas('×')}>×</T>
        {['4', '5', '6'].map((d) => <T key={d} onClick={() => rakam(d)}>{d}</T>)}
        <T tip="islem" onClick={() => islemBas('−')}>−</T>
        {['1', '2', '3'].map((d) => <T key={d} onClick={() => rakam(d)}>{d}</T>)}
        <T tip="islem" onClick={() => islemBas('+')}>+</T>
        <T genis onClick={() => rakam('0')}>0</T>
        <T onClick={() => rakam(',')}>,</T>
        <T tip="islem" onClick={esittir}>=</T>
      </div>
    </div>
  )
}

/* ── Karalama ───────────────────────────────────────────────── */
function Karalama() {
  const tuvalRef = useRef(null)
  const cizerRef = useRef(false)
  const [kalinlik, setKalinlik] = useState(3)
  const [renk, setRenk] = useState('#1f49f0')

  useEffect(() => {
    const t = tuvalRef.current
    if (!t) return
    const olcekle = () => {
      const dpr = window.devicePixelRatio || 1
      const r = t.getBoundingClientRect()
      const eski = t.width ? t.toDataURL() : null
      t.width = Math.round(r.width * dpr)
      t.height = Math.round(r.height * dpr)
      const c = t.getContext('2d')
      c.scale(dpr, dpr)
      c.lineCap = 'round'
      c.lineJoin = 'round'
      if (eski) {
        const img = new Image()
        img.onload = () => c.drawImage(img, 0, 0, r.width, r.height)
        img.src = eski
      }
    }
    olcekle()
    window.addEventListener('resize', olcekle)
    return () => window.removeEventListener('resize', olcekle)
  }, [])

  const nokta = (e) => {
    const r = tuvalRef.current.getBoundingClientRect()
    const t = e.touches?.[0] || e
    return { x: t.clientX - r.left, y: t.clientY - r.top }
  }
  const bas = (e) => {
    e.preventDefault()
    cizerRef.current = true
    const c = tuvalRef.current.getContext('2d')
    const { x, y } = nokta(e)
    c.beginPath()
    c.moveTo(x, y)
  }
  const ciz = (e) => {
    if (!cizerRef.current) return
    e.preventDefault()
    const c = tuvalRef.current.getContext('2d')
    const { x, y } = nokta(e)
    c.strokeStyle = renk
    c.lineWidth = kalinlik
    c.lineTo(x, y)
    c.stroke()
  }
  const birak = () => (cizerRef.current = false)
  const temizle = () => {
    const t = tuvalRef.current
    t.getContext('2d').clearRect(0, 0, t.width, t.height)
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        {['#1f49f0', '#e11d48', '#059669', '#1c2030'].map((r) => (
          <button
            key={r}
            onClick={() => setRenk(r)}
            className={cx('h-7 w-7 rounded-full border-2 transition', renk === r ? 'border-ink-900 dark:border-white' : 'border-transparent')}
            style={{ background: r }}
            aria-label="Renk"
          />
        ))}
        <input
          type="range"
          min="1"
          max="10"
          value={kalinlik}
          onChange={(e) => setKalinlik(Number(e.target.value))}
          className="ml-1 h-1.5 flex-1 accent-brand-600"
          aria-label="Kalınlık"
        />
        <button onClick={temizle} className="rounded-lg p-1.5 text-ink-400 hover:text-ink-600" aria-label="Temizle">
          <IconRefresh size={17} />
        </button>
      </div>
      <canvas
        ref={tuvalRef}
        className="h-64 w-full touch-none rounded-xl border border-ink-200 bg-white dark:border-white/10"
        onMouseDown={bas}
        onMouseMove={ciz}
        onMouseUp={birak}
        onMouseLeave={birak}
        onTouchStart={bas}
        onTouchMove={ciz}
        onTouchEnd={birak}
      />
    </div>
  )
}

/* ── Kapsayıcı ──────────────────────────────────────────────── */
export default function SinavAraclari() {
  const [acik, setAcik] = useState(null) // null | 'hesap' | 'karalama'

  useEffect(() => {
    if (!acik) return
    const h = (e) => e.key === 'Escape' && setAcik(null)
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [acik])

  return (
    <>
      <div className="fixed bottom-24 right-3 z-30 flex flex-col gap-2 lg:bottom-6">
        <button
          onClick={() => setAcik(acik === 'hesap' ? null : 'hesap')}
          className={cx(
            'grid h-11 w-11 place-items-center rounded-full shadow-lift transition',
            acik === 'hesap' ? 'bg-brand-700 text-white' : 'bg-white text-brand-600 dark:bg-ink-900 dark:text-brand-300'
          )}
          aria-label="Hesap makinesi"
          title="Hesap makinesi"
        >
          <IconCalc size={20} />
        </button>
        <button
          onClick={() => setAcik(acik === 'karalama' ? null : 'karalama')}
          className={cx(
            'grid h-11 w-11 place-items-center rounded-full shadow-lift transition',
            acik === 'karalama' ? 'bg-brand-700 text-white' : 'bg-white text-brand-600 dark:bg-ink-900 dark:text-brand-300'
          )}
          aria-label="Karalama"
          title="Karalama kâğıdı"
        >
          <IconNote size={20} />
        </button>
      </div>

      {acik && (
        <div className="fixed inset-x-2 bottom-24 z-40 mx-auto max-w-sm rounded-2xl border border-ink-200 bg-white p-3 shadow-lift dark:border-white/10 dark:bg-ink-900 lg:bottom-6 lg:right-20 lg:left-auto lg:mx-0">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold">{acik === 'hesap' ? 'Hesap Makinesi' : 'Karalama Kâğıdı'}</p>
            <button onClick={() => setAcik(null)} className="rounded-lg p-1 text-ink-400 hover:text-ink-600" aria-label="Kapat">
              <IconClose size={16} />
            </button>
          </div>
          {acik === 'hesap' ? <Hesap /> : <Karalama />}
        </div>
      )}
    </>
  )
}
