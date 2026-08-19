/* Gerçek soru bankasında 4 soruda 6 şık (A-F) var; dizi buna göre uzun tutuldu.
   Daha uzunu gelirse harf üretilir, 'undefined' gösterilmez. */
export const HARFLER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
export const harf = (i) => HARFLER[i] || String.fromCharCode(65 + i)

export function karistir(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const rastgele = (arr) => arr[Math.floor(Math.random() * arr.length)]

export function sureFormat(sn) {
  sn = Math.max(0, Math.floor(sn))
  const s = sn % 60
  const d = Math.floor(sn / 60) % 60
  const h = Math.floor(sn / 3600)
  const p = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${p(h)}:${p(d)}:${p(s)}` : `${p(d)}:${p(s)}`
}

export function tarihFormat(ts) {
  return new Date(ts).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function saatFormat(ts) {
  return new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

export const sayi = (n) => new Intl.NumberFormat('tr-TR').format(n ?? 0)

export function geriSayim(hedef, simdi = Date.now()) {
  let fark = Math.max(0, new Date(hedef).getTime() - simdi)
  const gun = Math.floor(fark / 864e5)
  fark -= gun * 864e5
  const saat = Math.floor(fark / 36e5)
  fark -= saat * 36e5
  const dakika = Math.floor(fark / 6e4)
  fark -= dakika * 6e4
  const saniye = Math.floor(fark / 1000)
  return { gun, saat, dakika, saniye, bitti: new Date(hedef).getTime() <= simdi }
}

export const cx = (...a) => a.filter(Boolean).join(' ')

/** Metindeki #etiketleri ayırır. */
export function etiketAyir(metin = '') {
  const etiketler = metin.match(/#[\wçğıöşüÇĞİÖŞÜ]+/g) || []
  return { metin: metin.replace(/#[\wçğıöşüÇĞİÖŞÜ]+/g, '').trim(), etiketler }
}

export function yuzde(a, b) {
  if (!b) return 0
  return Math.min(100, Math.round((a / b) * 100))
}

/** localStorage'a güvenli yazma/okuma */
export const ls = {
  get(k, def = null) {
    try {
      const v = localStorage.getItem(k)
      return v == null ? def : JSON.parse(v)
    } catch {
      return def
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, JSON.stringify(v))
    } catch {}
  },
  sil(k) {
    try {
      localStorage.removeItem(k)
    } catch {}
  },
}
