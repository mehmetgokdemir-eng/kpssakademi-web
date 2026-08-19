import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'

const KEY = 'ka:settings:v1'
const THEME_KEY = 'ka:theme'

const defaults = {
  ad: '',
  sinavTarihi: '', // 'YYYY-MM-DDTHH:mm' — boşsa otomatik hesaplanır
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

/* KPSS sınav tarihi: kullanıcı belirlemediyse, yaklaşık olarak
   her yıl Temmuz ayının ikinci pazarı 10:15 kabul edilir. */
export function varsayilanSinavTarihi(ref = new Date()) {
  const hesapla = (yil) => {
    const d = new Date(yil, 6, 1, 10, 15, 0)
    const ilkPazar = 1 + ((7 - d.getDay()) % 7)
    return new Date(yil, 6, ilkPazar + 7, 10, 15, 0)
  }
  let t = hesapla(ref.getFullYear())
  if (t.getTime() < ref.getTime()) t = hesapla(ref.getFullYear() + 1)
  return t
}

export function sinavTarihiniAl(settings) {
  if (settings.sinavTarihi) {
    const t = new Date(settings.sinavTarihi)
    if (!isNaN(t)) return t
  }
  return varsayilanSinavTarihi()
}
