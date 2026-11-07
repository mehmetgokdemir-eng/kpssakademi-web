/* Sağ yan şeritte duran mobil uygulama kartı.
 *
 * Android sürümü 28 Ekim 2026'da Google Play'de, iPhone sürümü Kasım 2026'da
 * App Store'da yayına girdi. YAYINDA ve IOS_YAYINDA bayrakları siteyi dolaşan
 * bütün mağaza bağlantılarını birden açıp kapatır; bir listeleme kaldırılırsa
 * tek yapılacak ilgili bayrağı false çevirmek.
 *
 * Kart KAPATILAMAZ. Önceden kapatma düğmesi vardı; kart aylarca "çok yakında"
 * yazdığı için çoğu kullanıcı onu kapatmıştı ve uygulama yayına girdiğinde o
 * kullanıcılara bir daha hiç görünmüyordu. Kalıcı olması istendiği için
 * kapatma düğmesi ve localStorage kaydı tamamen kaldırıldı.
 */

export const YAYINDA = true
export const IOS_YAYINDA = true
export const PLAY_ADRESI = 'https://play.google.com/store/apps/details?id=com.nihangokdemir.kpss'
export const APP_STORE_ADRESI = 'https://apps.apple.com/tr/app/id6826406637'

/* Ziyaretçi iPhone ya da iPad'den giriyorsa doğru mağazayı seçer. Yalnızca
   tek düğmeye yer olan yerlerde (değerlendirme daveti) kullanılıyor; yer
   olan yerlerde iki mağaza da yan yana gösteriliyor. */
export function iosCihaz() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iPhone|iPad|iPod/i.test(ua)) return true
  // iPadOS kendini masaüstü Mac gibi tanıtır; dokunmatik nokta sayısı ayırt eder.
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
}
export const magazaAdresi = () => (iosCihaz() ? APP_STORE_ADRESI : PLAY_ADRESI)
export const magazaAdi = () => (iosCihaz() ? 'App Store' : 'Play Store')

function IconTelefon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="6" y="2" width="12" height="20" rx="2.5" />
      <path d="M11 18.4h2" />
    </svg>
  )
}

export default function AndroidYakinda() {
  const yayinda = YAYINDA || IOS_YAYINDA

  return (
    <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-3 dark:border-emerald-400/20 dark:bg-emerald-400/[0.07]">
      <div className="mb-1.5 flex items-start gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-600 text-white">
          <IconTelefon size={16} />
        </span>
        <p className="flex-1 pt-0.5 text-[12px] font-bold leading-tight">Mobil uygulama</p>
      </div>

      {yayinda ? (
        <>
          <p className="mb-2 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
            {YAYINDA && IOS_YAYINDA
              ? "Google Play ve App Store'da yayında. Aynı içerik, aynı ilerleme."
              : YAYINDA
                ? "Google Play'de yayında. Aynı içerik, aynı ilerleme."
                : "App Store'da yayında. Aynı içerik, aynı ilerleme."}
          </p>
          {YAYINDA && (
            <a
              href={PLAY_ADRESI}
              target="_blank"
              rel="noreferrer"
              className="btn-primary w-full !bg-emerald-600 !py-1.5 !text-[11px]"
            >
              Google Play'den indir
            </a>
          )}
          {IOS_YAYINDA && (
            <a
              href={APP_STORE_ADRESI}
              target="_blank"
              rel="noreferrer"
              className="btn-primary mt-1.5 w-full !bg-emerald-600 !py-1.5 !text-[11px]"
            >
              App Store'dan indir
            </a>
          )}
        </>
      ) : (
        <>
          <span className="mb-2 inline-block rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Çok yakında
          </span>
          <p className="text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
            Mağazalarda yayına hazırlanıyor. O zamana kadar siteyi telefonuna uygulama olarak
            kurabilirsin — aynı şekilde çalışır, çevrimdışı da açılır.
          </p>
        </>
      )}
    </div>
  )
}
