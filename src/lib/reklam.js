/* AdSense yapılandırması ve çerez izni durumu.
 *
 * Reklamlar MANUEL yerleşimlidir (otomatik reklamlar değil). Sebep: oyunlarda
 * ve sınav/soru çözme sırasında reklam görünmemesi kuralı — otomatik reklamlar
 * yerleşimi Google'a bıraktığı için bu kural garanti edilemez.
 *
 * Reklam birimi kimliklerini AdSense panelinden alıp aşağıya yapıştırın.
 * Kimlik boş bırakılan yerde hiçbir şey render edilmez (boşluk da kalmaz),
 * yani kimlikler girilene kadar site reklamsız çalışmaya devam eder.
 */

export const ADSENSE_ID = 'ca-pub-6166144150941943'

/** AdSense → Reklamlar → Reklam birimine göre → Görüntülü reklam ile oluşturulan slot kimlikleri */
export const SLOTLAR = {
  anaSayfa: '', // ör. '1234567890'
  dersListesi: '',
  sonuc: '', // quiz / deneme sonuç ekranı
  rehber: '', // statik SEO sayfaları
}

const ONAY_ANAHTARI = 'ka:reklam-onayi' // 'izin' | 'kisisellestirmesiz' | null

const dinleyiciler = new Set()
let onay = oku()

function oku() {
  try {
    return localStorage.getItem(ONAY_ANAHTARI)
  } catch {
    return null
  }
}

export const onayDurumu = () => onay
export const onayVerildi = () => onay != null

export function onayAbone(fn) {
  dinleyiciler.add(fn)
  return () => dinleyiciler.delete(fn)
}

/** Google Consent Mode v2 güncellemesi */
function gtagGuncelle(izinli) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('consent', 'update', {
    ad_storage: izinli ? 'granted' : 'denied',
    ad_user_data: izinli ? 'granted' : 'denied',
    ad_personalization: izinli ? 'granted' : 'denied',
  })
}

export function onayKaydet(deger) {
  onay = deger
  try {
    localStorage.setItem(ONAY_ANAHTARI, deger)
  } catch {}
  gtagGuncelle(deger === 'izin')
  dinleyiciler.forEach((f) => f(onay))
}

export function onaySifirla() {
  onay = null
  try {
    localStorage.removeItem(ONAY_ANAHTARI)
  } catch {}
  dinleyiciler.forEach((f) => f(onay))
}
