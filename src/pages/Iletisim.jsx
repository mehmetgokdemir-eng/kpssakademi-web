import { Baslik } from '../components/Layout.jsx'
import { IconLink, IconNote, IconBulb } from '../components/Icons.jsx'

/* Alan adının MX kaydı yok (DNS yalnızca Vercel'e yönlendiriliyor), bu yüzden
   @kpssakademi.tr adresine gelen postalar teslim edilemez. İletişim adresi
   bilinçli olarak çalışan bir posta kutusudur. */
const EPOSTA = 'mehmetgokdemir@gmail.com'

export default function Iletisim() {
  return (
    <>
      <Baslik baslik="İletişim" altBaslik="Soru, öneri ve hata bildirimi" />

      <div className="card mb-4 p-5">
        <p className="text-sm leading-relaxed text-ink-600 dark:text-ink-300">
          KPSS Akademi'yi tek kişilik bir ekip geliştiriyor. Yazdığın her mesaj okunuyor; özellikle hatalı soru
          bildirimleri hızla düzeltiliyor.
        </p>
        <a href={`mailto:${EPOSTA}?subject=KPSS%20Akademi`} className="btn-primary mt-4 w-full">
          E-posta Gönder
        </a>
        <p className="mt-2 break-all text-center text-xs text-ink-400">{EPOSTA}</p>
      </div>

      <div className="space-y-2.5">
        <Kutu
          Ikon={IconNote}
          baslik="Hatalı soru bildirimi"
          metin="Sorunun kendisini veya ekran görüntüsünü, hangi ders ve konuda olduğunu yazman yeterli. Cevap anahtarı hatalarını öncelikli düzeltiyoruz."
        />
        <Kutu
          Ikon={IconBulb}
          baslik="Özellik önerisi"
          metin="Eksik bulduğun bir çalışma aracı varsa yaz. Uygulamadaki birçok özellik kullanıcı önerisiyle eklendi."
        />
        <Kutu
          Ikon={IconLink}
          baslik="Gizlilik ve veri talepleri"
          metin="Verilerin cihazında tutulduğu için silme işlemini Ayarlar'dan kendin yapabilirsin. KVKK kapsamındaki diğer talepler için aynı adrese yazabilirsin."
        />
      </div>

      <div className="card mt-4 p-4">
        <p className="text-xs leading-relaxed text-ink-400">
          KPSS Akademi bağımsız bir çalışma aracıdır; ÖSYM ile resmî bir bağlantısı yoktur. Sınav tarihleri,
          kılavuzlar ve resmî sonuçlar için <b>osym.gov.tr</b> esas alınmalıdır.
        </p>
      </div>
    </>
  )
}

function Kutu({ Ikon, baslik, metin }) {
  return (
    <div className="card flex gap-3.5 p-4">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
        <Ikon size={20} />
      </span>
      <div>
        <p className="text-sm font-bold">{baslik}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">{metin}</p>
      </div>
    </div>
  )
}
