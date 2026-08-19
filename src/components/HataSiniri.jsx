import { Component, useEffect } from 'react'
import { lazy } from 'react'

/* Neden var:
 * Sayfaların tamamı React.lazy ile ayrı parçalar (chunk) hâlinde yükleniyor.
 * Bir butona basıldığında o sayfanın parçası /assets/ altından indiriliyor.
 *
 * Yeni bir sürüm yayına alındığında dosya adları değişir ve Vercel eskilerini
 * siler. O sırada açık duran sekme hâlâ ESKİ adları biliyor; kullanıcı bir
 * butona bastığında indirme 404 döner, React.lazy hata fırlatır ve hata sınırı
 * olmadığı için React TÜM AĞACI söker — ekran bomboş kalır. Sayfa yenilenince
 * yeni HTML gelir ve düzelir. "İlk tıklamada boş, yenileyince geliyor" ve
 * "geri/ileri yapınca boş" belirtilerinin sebebi tam olarak budur.
 *
 * Burada o hatayı yakalıyoruz: parça indirilemediyse bir kez otomatik
 * yenileniyoruz (sonsuz döngü olmasın diye sessionStorage ile işaretleyerek),
 * başka bir hatada ise boş ekran yerine okunabilir bir mesaj gösteriyoruz.
 */

const YENILENDI = 'ka:parca-yenileme'

const parcaHatasiMi = (e) =>
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk|ChunkLoadError/i.test(
    String(e?.message || e),
  )

/* Otomatik yenileme, son denemenin üzerinden ARALIK geçtiyse yapılır.
   Basit bir "yenilendi mi" bayrağı yetmiyor: bayrağı sıfırlayan herhangi bir
   yer (ör. her açılışta temizleyen bir efekt) sonsuz yenileme döngüsü kuruyor —
   sayfa açılır, parça yine yüklenemez, yine yenilenir. Zaman damgası bunu
   yapısal olarak imkânsız kılar, üstelik ilerideki bir yayında yeniden
   denenmesine de izin verir. */
const ARALIK = 20000

function birKezYenile() {
  try {
    const son = Number(sessionStorage.getItem(YENILENDI) || 0)
    if (Date.now() - son < ARALIK) return false
    sessionStorage.setItem(YENILENDI, String(Date.now()))
  } catch {
    return false
  }
  window.location.reload()
  return true
}

/** Sayfa parçası indirilemediğinde ekrana basılan bileşen. */
export function ParcaHatasi() {
  useEffect(() => {
    birKezYenile()
  }, [])
  return (
    <div className="card mx-auto my-10 max-w-md p-6 text-center">
      <p className="text-lg font-bold">Yeni sürüm yayınlandı</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
        Uygulama güncellendiği için bu sayfa yüklenemedi. Yenilediğinde en son sürümle devam edeceksin.
      </p>
      <button className="btn-primary mt-4 w-full" onClick={() => window.location.reload()}>
        Sayfayı Yenile
      </button>
      <a href="/" className="btn-ghost mt-2 w-full">
        Ana Sayfa
      </a>
    </div>
  )
}

/* Sayfa yükleyici.
 *
 * React.lazy'nin promise'i REDDEDİLİRSE, hatanın Suspense'in içinden hata
 * sınırına ulaşacağı garanti değil: pratikte ekran yükleme iskeletinde
 * sonsuza kadar asılı kalabiliyor. Bu yüzden reddi hiç dışarı bırakmıyoruz —
 * başarısız yükleme, hata ekranını çizen geçerli bir bileşene dönüşüyor.
 * Böylece Suspense her hâlükârda çözülür ve ekran asla boş kalmaz.
 *
 * Sıra: yükle → 500 ms sonra bir kez daha dene → yine olmazsa hata ekranı
 * (kendisi bir kez otomatik yeniler; yayın sonrası vakaların çoğunu kapatır).
 */
export const sayfaYukleyici = (yukle) =>
  lazy(() =>
    yukle().catch(() =>
      new Promise((r) => setTimeout(r, 500))
        .then(yukle)
        .catch(() => ({ default: ParcaHatasi }))
    )
  )

export default class HataSiniri extends Component {
  state = { hata: null }

  static getDerivedStateFromError(hata) {
    return { hata }
  }

  componentDidCatch(hata) {
    if (parcaHatasiMi(hata)) birKezYenile()
  }

  render() {
    const { hata } = this.state
    if (!hata) return this.props.children

    const parca = parcaHatasiMi(hata)
    return (
      <div className="card mx-auto my-10 max-w-md p-6 text-center">
        <p className="text-lg font-bold">{parca ? 'Yeni sürüm yayınlandı' : 'Bir şeyler ters gitti'}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
          {parca
            ? 'Uygulama güncellendiği için bu sayfa yüklenemedi. Yenilediğinde en son sürümle devam edeceksin.'
            : 'Bu sayfa açılırken beklenmedik bir hata oluştu. Yenilemek çoğu zaman yeterli oluyor.'}
        </p>
        <button className="btn-primary mt-4 w-full" onClick={() => window.location.reload()}>
          Sayfayı Yenile
        </button>
        <a href="/" className="btn-ghost mt-2 w-full">
          Ana Sayfa
        </a>
        {!parca && (
          <p className="mt-3 break-words text-left text-[11px] text-ink-400">{String(hata?.message || hata)}</p>
        )}
      </div>
    )
  }
}
