/* AdSense yapılandırması ve çerez izni durumu.
 *
 * KARMA MODEL:
 *   - Otomatik reklamlar (Auto ads) AdSense panelinden AÇIK. Kod tarafında iş
 *     yapılmaz; AdSense reklam kodu şu an kaldırıldı (onay/itiraz süreci).
 *   - Ek olarak, aşağıdaki slot kimlikleriyle MANUEL birimler de çalışır
 *     (ana sayfa, ders listesi, sonuç ekranları, SEO sayfaları).
 *   - Oyun / soru çözme / sınav / kart ekranlarında otomatik reklam
 *     ENGELLENİR — bkz. lib/otomatikReklam.js ve ADSENSE.md § 3.
 *
 * Reklam birimi kimliklerini AdSense panelinden alıp aşağıya yapıştırın.
 * Kimlik boş bırakılan yerde hiçbir şey render edilmez (boşluk da kalmaz),
 * yani kimlikler girilene kadar yalnızca otomatik reklamlar görünür.
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
