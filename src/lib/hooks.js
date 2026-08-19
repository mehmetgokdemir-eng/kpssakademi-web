import { useCallback, useEffect, useRef, useState } from 'react'
import { getState, subscribe } from './storage.js'

/** Depoyu dinler; her değişimde bileşeni yeniler. */
export function useProgress() {
  const [, setTick] = useState(0)
  useEffect(() => subscribe(() => setTick((t) => t + 1)), [])
  return getState()
}

/** Promise döndüren bir fonksiyonu çalıştırır; { veri, yukleniyor, hata, yenile } döner. */
export function useAsync(fn, deps = []) {
  const [durum, setDurum] = useState({ veri: null, yukleniyor: true, hata: null })
  const fnRef = useRef(fn)
  fnRef.current = fn

  const calistir = useCallback(() => {
    let iptal = false
    setDurum((d) => ({ ...d, yukleniyor: true, hata: null }))
    Promise.resolve()
      .then(() => fnRef.current())
      .then((veri) => !iptal && setDurum({ veri, yukleniyor: false, hata: null }))
      .catch((hata) => !iptal && setDurum({ veri: null, yukleniyor: false, hata }))
    return () => {
      iptal = true
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(calistir, [calistir])
  return { ...durum, yenile: calistir }
}

/** Saniyede bir tetiklenen sayaç (geri sayım, süre ölçümü). */
export function useTicker(aktif = true, ms = 1000) {
  const [t, setT] = useState(() => Date.now())
  useEffect(() => {
    if (!aktif) return
    const i = setInterval(() => setT(Date.now()), ms)
    return () => clearInterval(i)
  }, [aktif, ms])
  return t
}

/** Bileşen açık kaldığı süreyi saniye olarak ölçer. */
export function useSureOlcer() {
  const bas = useRef(Date.now())
  const sifirla = useCallback(() => {
    bas.current = Date.now()
  }, [])
  const gecen = useCallback(() => Math.round((Date.now() - bas.current) / 1000), [])
  return { sifirla, gecen }
}

export function useMedia(query) {
  const [m, setM] = useState(() => window.matchMedia?.(query).matches ?? false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const h = (e) => setM(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [query])
  return m
}
