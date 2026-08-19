import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'

const KEY = 'ka:settings:v1'
const THEME_KEY = 'ka:theme'

const defaults = {
  ad: '',
  sinavTuru: 'lisans', // SINAV_TURLERI anahtarı — geri sayım bunu esas alır
  sinavTarihi: '', // 'YYYY-MM-DDTHH:mm' — doluysa sınav türünü ezer
  gunlukHedef: 50, // soru/gün
  haftalikHedef: 300,
  puanTuru: 'P3',
  muzikAcik: false,
  muzikParca: 'chopin',
  muzikSes: 0.35,
  sesEfekt: true,
  tts: true,
  ttsHiz: 1,
  siklariKaristir: false,
  otomatikSonraki: false,
  aciklamaGoster: true,
}

const Ctx = createContext(null)

function loadSettings() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }
  } catch {
    return { ...defaults }
  }
}

function loadTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY)
    if (t) return t
  } catch {}
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings)
  const [theme, setThemeState] = useState(loadTheme)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings))
    } catch {}
  }, [settings])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {}
  }, [theme])

  const set = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), [])
  const toggleTheme = useCallback(() => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')), [])

  const value = useMemo(
    () => ({ settings, set, theme, setTheme: setThemeState, toggleTheme }),
    [settings, set, theme, toggleTheme]
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSettings() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useSettings SettingsProvider içinde kullanılmalı')
  return v
}

/* ── KPSS sınav tarihleri ──────────────────────────────────────────────
   Eskiden tarih "her yıl temmuzun ikinci pazarı" diye TAHMİN ediliyordu.
   Bu tahmin gerçeği tutmuyor: ÖSYM 2026'da sınavları eylül–ekime aldı,
   dolayısıyla geri sayım aylarca yanlış gösteriyordu.

   Artık ÖSYM'nin açıkladığı GERÇEK tarihler aşağıda duruyor. Yeni takvim
   yayımlandıkça ilgili dizinin başına eklemek yeterli — kod, bugünden
   sonraki ilk tarihi kendisi seçer.

   Saat 10.15 KPSS oturumlarının alışılmış başlangıç saatidir; geri sayımda
   yalnızca son birkaç saati etkiler, belirleyici olan tarihtir. */
export const SINAV_TURLERI = {
  lisans: {
    ad: 'KPSS Lisans — Genel Yetenek / Genel Kültür',
    kisa: 'Lisans (GY-GK)',
    tarihler: ['2026-09-06T10:15'],
  },
  lisansAlan: {
    ad: 'KPSS Lisans — Alan Bilgisi (A Grubu)',
    kisa: 'Alan Bilgisi',
    tarihler: ['2026-09-12T10:15'],
  },
  egitimBilimleri: {
    ad: 'KPSS Lisans — Eğitim Bilimleri',
    kisa: 'Eğitim Bilimleri',
    tarihler: ['2026-09-06T10:15'],
  },
  onlisans: {
    ad: 'KPSS Ön Lisans',
    kisa: 'Ön Lisans',
    tarihler: ['2026-10-04T10:15'],
  },
  ortaogretim: {
    ad: 'KPSS Ortaöğretim (Lise)',
    kisa: 'Ortaöğretim',
    tarihler: ['2026-10-25T10:15'],
  },
}

export const VARSAYILAN_SINAV_TURU = 'lisans'

/** Seçilen türde, referans andan sonraki ilk sınav tarihi. Yoksa null. */
export function siradakiSinav(turId = VARSAYILAN_SINAV_TURU, ref = new Date()) {
  const tur = SINAV_TURLERI[turId] || SINAV_TURLERI[VARSAYILAN_SINAV_TURU]
  for (const s of tur.tarihler) {
    const t = new Date(s)
    if (!isNaN(t) && t.getTime() > ref.getTime()) return t
  }
  return null
}

/** Takvimde ileri tarih kalmadığında kullanılan kaba tahmin (eylülün ilk pazarı). */
export function tahminiSinavTarihi(ref = new Date()) {
  const hesapla = (yil) => {
    const d = new Date(yil, 8, 1, 10, 15, 0)
    return new Date(yil, 8, 1 + ((7 - d.getDay()) % 7), 10, 15, 0)
  }
  let t = hesapla(ref.getFullYear())
  if (t.getTime() < ref.getTime()) t = hesapla(ref.getFullYear() + 1)
  return t
}

/** Geri sayımda gösterilecek tarih + bunun gerçek mi tahmini mi olduğu. */
export function sinavBilgisi(settings = {}) {
  if (settings.sinavTarihi) {
    const t = new Date(settings.sinavTarihi)
    if (!isNaN(t)) return { tarih: t, kaynak: 'kullanici', ad: 'Belirlediğin tarih' }
  }
  const turId = settings.sinavTuru || VARSAYILAN_SINAV_TURU
  const tur = SINAV_TURLERI[turId] || SINAV_TURLERI[VARSAYILAN_SINAV_TURU]
  const t = siradakiSinav(turId)
  if (t) return { tarih: t, kaynak: 'osym', ad: tur.kisa }
  return { tarih: tahminiSinavTarihi(), kaynak: 'tahmin', ad: tur.kisa }
}

export function sinavTarihiniAl(settings) {
  return sinavBilgisi(settings).tarih
}

/* Geriye dönük uyumluluk: eski adla çağıran yerler için. */
export const varsayilanSinavTarihi = (ref = new Date()) => siradakiSinav(VARSAYILAN_SINAV_TURU, ref) || tahminiSinavTarihi(ref)
