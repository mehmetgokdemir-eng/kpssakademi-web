import { Link } from 'react-router-dom'
import { Baslik } from '../components/Layout.jsx'
import { onayDurumu, onaySifirla } from '../lib/reklam.js'
import { useProgress } from '../lib/hooks.js'

export default function Gizlilik() {
  useProgress()
  const durum = onayDurumu()

  return (
    <>
      <Baslik baslik="Gizlilik Politikası" altBaslik="kpssakademi.tr" />
      <div className="card space-y-4 p-5 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
        <p className="text-xs text-ink-400">Son güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>

        <section>
          <h2 className="mb-1 text-base font-bold text-ink-900 dark:text-white">Kısaca</h2>
          <p>
            Çalışma verileriniz <b>yalnızca kendi tarayıcınızda</b> saklanır. Hesap açmanız gerekmez; çözdüğünüz
            sorular, notlarınız ve deneme sonuçlarınız bize gönderilmez. Site, ücretsiz kalabilmek için
            <b> Google reklamları</b> gösterir.
          </p>
        </section>

        <section>
          <h2 className="mb-1 text-base font-bold text-ink-900 dark:text-white">Cihazınızda saklananlar</h2>
          <p>
            Adınız, hedefleriniz, tema tercihiniz, çözüm geçmişiniz, yanlışlarınız, kayıtlı sorularınız,
            notlarınız, deneme sonuçlarınız ve oyun skorlarınız tarayıcınızın yerel depolamasında (localStorage)
            tutulur. Bu veriler cihazınızdan çıkmaz. <Link to="/ayarlar" className="font-semibold text-brand-600">Ayarlar &gt; Verilerim</Link>{' '}
            bölümünden dışa aktarabilir veya tamamen silebilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="mb-1 text-base font-bold text-ink-900 dark:text-white">Reklamlar ve çerezler</h2>
          <p>
            Reklamlar Google AdSense üzerinden yayınlanır. Google ve iş ortakları, size daha alakalı reklam
            gösterebilmek için çerez ve benzeri teknolojiler kullanabilir; bu kapsamda IP adresiniz, tarayıcı
            bilgileriniz ve site içindeki gezinme verileriniz Google tarafından işlenebilir.
          </p>
          <p className="mt-2">
            Siteye ilk girişinizde bir tercih sorulur. <b>Kişiselleştirmeye izin vermezseniz reklamlar yine
            gösterilir</b>, yalnızca ilgi alanlarınıza göre hedefleme yapılmaz — bu, reklamların tamamen
            kapatılması anlamına gelmez.
          </p>
          <p className="mt-2">
            Google'ın veri kullanımı hakkında ayrıntılı bilgi için{' '}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-brand-600"
            >
              Google'ın iş ortağı siteler politikası
            </a>
            'na bakabilir, reklam ayarlarınızı{' '}
            <a href="https://adssettings.google.com" target="_blank" rel="noreferrer" className="font-semibold text-brand-600">
              Google Reklam Ayarları
            </a>
            'ndan yönetebilirsiniz.
          </p>
          <div className="mt-3 rounded-xl bg-ink-100 p-3 dark:bg-white/5">
            <p className="text-xs">
              Mevcut tercihiniz:{' '}
              <b>
                {durum === 'izin'
                  ? 'Kişiselleştirilmiş reklamlara izin verildi'
                  : durum === 'kisisellestirmesiz'
                    ? 'Kişiselleştirme kapalı'
                    : 'Henüz seçim yapılmadı'}
              </b>
            </p>
            {durum && (
              <button className="btn-ghost mt-2 !py-1.5 !text-xs" onClick={onaySifirla}>
                Tercihimi değiştir
              </button>
            )}
          </div>
        </section>

        <section>
          <h2 className="mb-1 text-base font-bold text-ink-900 dark:text-white">Sunucu kayıtları</h2>
          <p>
            Siteyi barındıran sunucu, standart erişim kayıtları (IP adresi, tarayıcı bilgisi, istek zamanı)
            tutabilir. Bu kayıtlar güvenlik ve hata ayıklama amacıyla kullanılır.
          </p>
        </section>

        <section>
          <h2 className="mb-1 text-base font-bold text-ink-900 dark:text-white">Diğer üçüncü taraflar</h2>
          <p>
            Yazı tipleri Google Fonts üzerinden yüklenir; bu istek sırasında IP adresiniz Google'a iletilir.
            Coğrafya oyunlarındaki "Vikipedi'de oku" bağlantıları Vikipedi'ye yönlendirir.
          </p>
        </section>

        <section>
          <h2 className="mb-1 text-base font-bold text-ink-900 dark:text-white">Çocukların gizliliği</h2>
          <p>Hizmet, sınav hazırlığı yapan yetişkinlere yöneliktir ve çocuklardan bilerek kişisel veri toplamaz.</p>
        </section>

        <section>
          <h2 className="mb-1 text-base font-bold text-ink-900 dark:text-white">Haklarınız ve iletişim</h2>
          <p>
            Verileriniz cihazınızda olduğu için silme ve dışa aktarma işlemlerini doğrudan Ayarlar sayfasından
            yapabilirsiniz. KVKK kapsamındaki talepleriniz ve diğer sorularınız için{' '}
            <Link to="/iletisim" className="font-semibold text-brand-600">
              iletişim sayfamıza
            </Link>{' '}
            bakabilirsiniz.
          </p>
        </section>
      </div>
      <div className="card mt-3 p-4">
        <p className="text-sm font-bold">Ziyaret istatistikleri</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
          Sitenin hangi sayfalarının ne kadar görüntülendiğini görmek için Vercel Web Analytics
          kullanılıyor. Bu araç <b>çerez kullanmaz</b>, IP adresini saklamaz ve ziyaretçileri kişisel
          olarak tanımlamaz; yalnızca sayfa görüntüleme sayısı, cihaz türü ve ülke düzeyinde toplu veri
          üretir. Bu nedenle çerez iznine bağlı değildir.
        </p>
      </div>
    </>
  )
}
