import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ls, cx } from '../lib/utils.js'
import { Baslik } from '../components/Layout.jsx'
import { IconClock, IconRefresh, IconQuiz, IconCheck } from '../components/Icons.jsx'

/* Odaklanma sayacı (Pomodoro) — Android'deki MotivasyonActivity'nin karşılığı.
 *
 * DİKKAT — sayaç DUVAR SAATİYLE çalışır, tick sayarak değil.
 * setInterval sekme arka plana alındığında kısılır; saniye sayan bir sayaç
 * 25 dakikayı 40 dakikada bitirir. Burada bitiş ANI saklanıyor, ekranda
 * gösterilen süre her karede "bitiş − şimdi" olarak hesaplanıyor.
 * Sayfa kapatılıp açılsa bile kaldığı yerden devam eder. */

const OTURUM = 'ka:odak'
const MODLAR = {
  calisma: { ad: 'Çalışma', dk: 25, renk: 'from-brand-600 to-brand-900', vurgu: 'text-brand-600' },
  kisa: { ad: 'Kısa Mola', dk: 5, renk: 'from-emerald-600 to-emerald-800', vurgu: 'text-emerald-600' },
  uzun: { ad: 'Uzun Mola', dk: 15, renk: 'from-violet-600 to-violet-900', vurgu: 'text-violet-600' },
}

const ikiHane = (n) => String(n).padStart(2, '0')

export default function Odak() {
  const kayit = ls.get(OTURUM, null)
  const [mod, setMod] = useState(kayit?.mod || 'calisma')
  const [bitis, setBitis] = useState(kayit?.bitis || 0)
  const [duraklatildi, setDuraklatildi] = useState(kayit?.kalan ?? null)
  const [tamamlanan, setTamamlanan] = useState(ls.get('ka:odak-tur', 0))
  const [, setKare] = useState(0)
  const sesRef = useRef(null)

  // Her saniye yeniden çiz — süre bitiş anından hesaplandığı için sapma olmaz
  useEffect(() => {
    if (!bitis) return
    const t = setInterval(() => setKare((k) => k + 1), 250)
    return () => clearInterval(t)
  }, [bitis])

  const toplamSn = MODLAR[mod].dk * 60
  const kalanSn = duraklatildi != null ? duraklatildi : bitis ? Math.max(0, Math.round((bitis - Date.now()) / 1000)) : toplamSn
  const calisiyor = !!bitis && duraklatildi == null

  // Süre bittiğinde
  useEffect(() => {
    if (!calisiyor || kalanSn > 0) return
    setBitis(0)
    ls.sil(OTURUM)
    if (mod === 'calisma') {
      const yeni = tamamlanan + 1
      setTamamlanan(yeni)
      ls.set('ka:odak-tur', yeni)
      setMod(yeni % 4 === 0 ? 'uzun' : 'kisa')
    } else {
      setMod('calisma')
    }
    try {
      sesRef.current?.play?.()
    } catch {}
    if ('vibrate' in navigator) navigator.vibrate?.([200, 100, 200])
  }, [calisiyor, kalanSn])

  const basla = () => {
    const sn = duraklatildi != null ? duraklatildi : toplamSn
    const yeniBitis = Date.now() + sn * 1000
    setBitis(yeniBitis)
    setDuraklatildi(null)
    ls.set(OTURUM, { mod, bitis: yeniBitis })
  }
  const duraklat = () => {
    setDuraklatildi(kalanSn)
    setBitis(0)
    ls.set(OTURUM, { mod, kalan: kalanSn })
  }
  const sifirla = () => {
    setBitis(0)
    setDuraklatildi(null)
    ls.sil(OTURUM)
  }
  const modDegistir = (m) => {
    setMod(m)
    sifirla()
  }

  const yuzde = Math.round(((toplamSn - kalanSn) / toplamSn) * 100)
  const cevre = 2 * Math.PI * 88

  return (
    <>
      <Baslik baslik="Odaklanma" altBaslik="25 dakika çalış, 5 dakika dinlen" />

      <div className="mb-4 flex gap-2">
        {Object.entries(MODLAR).map(([id, m]) => (
          <button
            key={id}
            onClick={() => modDegistir(id)}
            className={cx(
              'flex-1 rounded-xl px-2 py-2 text-xs font-bold transition',
              mod === id ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 dark:bg-white/5 dark:text-ink-300'
            )}
          >
            {m.ad}
            <span className="ml-1 opacity-70">{m.dk}dk</span>
          </button>
        ))}
      </div>

      <div className={cx('mb-4 rounded-3xl bg-gradient-to-br p-6 text-white shadow-lift', MODLAR[mod].renk)}>
        <div className="relative mx-auto grid h-52 w-52 place-items-center">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="10" />
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke="#fff"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={cevre}
              strokeDashoffset={cevre * (1 - yuzde / 100)}
              style={{ transition: 'stroke-dashoffset .4s linear' }}
            />
          </svg>
          <div className="text-center">
            <p className="text-5xl font-extrabold tabular-nums">
              {ikiHane(Math.floor(kalanSn / 60))}:{ikiHane(kalanSn % 60)}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider opacity-80">{MODLAR[mod].ad}</p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          {calisiyor ? (
            <button className="btn flex-1 !bg-white/20 !text-white" onClick={duraklat}>
              Duraklat
            </button>
          ) : (
            <button className="btn flex-1 !bg-white !text-brand-700" onClick={basla}>
              <IconClock size={17} /> {duraklatildi != null ? 'Devam Et' : 'Başlat'}
            </button>
          )}
          <button className="btn !bg-white/20 !px-4 !text-white" onClick={sifirla} aria-label="Sıfırla">
            <IconRefresh size={17} />
          </button>
        </div>
      </div>

      <div className="card mb-4 flex items-center gap-3 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15">
          <IconCheck size={20} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-bold">{tamamlanan} tur tamamlandı</p>
          <p className="text-[12px] text-ink-400">Her 4 çalışma turundan sonra uzun mola gelir.</p>
        </div>
        {tamamlanan > 0 && (
          <button
            className="text-xs font-semibold text-ink-400 hover:text-ink-600"
            onClick={() => {
              setTamamlanan(0)
              ls.set('ka:odak-tur', 0)
            }}
          >
            Sıfırla
          </button>
        )}
      </div>

      <div className="card mb-4 p-4">
        <p className="text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
          Sayaç sekmeyi kapatsan da devam eder; geri döndüğünde kaldığı yerden gösterir. Çalışma turunda
          bildirimleri kapatıp yalnızca soru çözmeye odaklan.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Link className="btn-primary" to="/hizli">
          <IconQuiz size={17} /> Hızlı Çalışma
        </Link>
        <Link className="btn-ghost" to="/tekrar">
          Bugünün Tekrarı
        </Link>
      </div>
    </>
  )
}
