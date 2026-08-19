/* Web Speech API ile Türkçe sesli okuma (Android uygulamasındaki TTS karşılığı). */

let sesler = []

function seslerYukle() {
  if (typeof speechSynthesis === 'undefined') return []
  sesler = speechSynthesis.getVoices()
  return sesler
}

if (typeof speechSynthesis !== 'undefined') {
  seslerYukle()
  speechSynthesis.onvoiceschanged = seslerYukle
}

export const ttsDestekli = () => typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined'

export function oku(metin, { hiz = 1, bitince } = {}) {
  if (!ttsDestekli() || !metin) return
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(String(metin))
  u.lang = 'tr-TR'
  u.rate = hiz
  const tr = (sesler.length ? sesler : seslerYukle()).find((s) => s.lang?.toLowerCase().startsWith('tr'))
  if (tr) u.voice = tr
  if (bitince) u.onend = bitince
  speechSynthesis.speak(u)
}

export function durdur() {
  if (ttsDestekli()) speechSynthesis.cancel()
}
