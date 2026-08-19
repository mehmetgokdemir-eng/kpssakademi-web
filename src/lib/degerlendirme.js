/* Puan/yorum isteği — Android'deki In-App Review'ın web karşılığı.
 *
 * İlke: rahatsız etmemek. İstek yalnızca kullanıcı uygulamayı gerçekten
 * kullandıysa çıkar, kapatılırsa uzun süre bir daha sorulmaz ve "beğenmedim"
 * yolu mağazaya değil geri bildirime gider. Beğenen/beğenmeyen ayrımı yaparak
 * yalnızca mutlu kullanıcıyı mağazaya yönlendirmek (review gating) YAPILMAZ —
 * iki seçenek de aynı anda görünür.
 */
import { ls } from './utils.js'
import { getState } from './storage.js'

const ANAHTAR = 'ka:degerlendirme'
const ESIK_SORU = 50 // en az bu kadar soru çözülmüş olmalı
const ESIK_GUN = 3 // en az bu kadar farklı günde kullanılmış olmalı
const TEKRAR_GUN = 90 // "sonra" denirse bu kadar gün sonra tekrar sor

const durum = () => ls.get(ANAHTAR, { kapatildi: false, sonGosterim: 0 })

export function istenmeliMi() {
  const d = durum()
  if (d.kapatildi) return false
  if (d.sonGosterim && Date.now() - d.sonGosterim < TEKRAR_GUN * 864e5) return false

  const s = getState()
  const cozulen = Object.keys(s.cozulen).length
  const kullanilanGun = Object.values(s.gunluk).filter((g) => g.soru > 0).length
  return cozulen >= ESIK_SORU && kullanilanGun >= ESIK_GUN
}

/** "Sonra sor" — belirli bir süre sessiz kal. */
export function ertele() {
  ls.set(ANAHTAR, { ...durum(), sonGosterim: Date.now() })
}

/** Bir daha hiç sorma. */
export function kapat() {
  ls.set(ANAHTAR, { ...durum(), kapatildi: true, sonGosterim: Date.now() })
}

export const PLAY_ADRESI = 'https://play.google.com/store/apps/details?id=com.nihangokdemir.kpss'
