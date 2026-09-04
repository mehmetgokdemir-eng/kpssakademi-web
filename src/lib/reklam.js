/* Yandex RTB (Yandex Partner — partner.yandex.com) reklam yapılandırması
 * + çerez izni durumu.
 *
 * NEDEN GUARD VAR: AdSense hesabı "geçersiz trafik" gerekçesiyle kalıcı
 * kapatıldı. Aynı hataya düşmemek için reklam kodu SADECE canlı alan adında
 * ve production derlemesinde yüklenir; geliştirme (localhost) ve Vercel
 * önizleme alan adları reklam saydırmaz.
 *
 * BLOK KİMLİKLERİ: Yandex Partner panelinden her yerleşim için ayrı reklam
 * birimi oluşturup R-A-... kimliğini buraya yapıştır. Kimlik boşsa o
 * yerleşimde hiçbir şey render edilmez (boşluk da kalmaz).
 *
 * Aynı blok kimliği farklı SAYFALARDA kullanılabilir (statik SEO sayfaları
 * ayrı yüklemeler). Ancak AYNI sayfada iki kez render edilmemeli — bu yüzden
 * her yerleşimin kendi kimliğini kullanması önerilir.
 */

export const REKLAM_BLOKLARI = {
  anaSayfa: 'R-A-19980035-1', //   ana sayfa alt bölümü
  dersListesi: '', //              /dersler — ayrı blok açılınca doldur
  sonuc: '', //                    quiz / deneme sonuç ekranı — ayrı blok
  rehber: 'R-A-19980035-1', //     statik SEO sayfaları (her sayfa ayrı yükleme)
}

/** Reklam kodu yalnızca canlı sitede + production'da çalışır. */
export function reklamAktif() {
  try {
    return (
      import.meta.env.PROD &&
      typeof window !== 'undefined' &&
      window.location.hostname === 'kpssakademi.tr'
    )
  } catch {
    return false
  }
}

/* ── Çerez izni durumu ──────────────────────────────────────
 * Yandex RTB kişiselleştirilmiş reklam için çerez kullanabilir; kullanıcı
 * onayını burada saklıyoruz. CerezBildirimi ve Gizlilik sayfası buna bağlı. */

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

/** Google Consent Mode v2 güncellemesi (GA4 için hâlâ geçerli) */
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
