import { useAsync } from '../lib/hooks.js'
import { getIndex } from '../lib/data.js'
import { sayi } from '../lib/utils.js'
import { Baslik } from '../components/Layout.jsx'
import { Istatistik } from '../components/UI.jsx'
import { YAYINDA, PLAY_ADRESI } from '../components/AndroidYakinda.jsx'

export default function Hakkinda() {
  const { veri } = useAsync(() => getIndex().catch(() => null), [])
  const i = veri?.istatistik

  return (
    <>
      <Baslik baslik="Hakkında" altBaslik="KPSS Akademi Web" />

      <div className="card mb-4 flex items-center gap-4 p-5">
        <img src="/icons/icon.svg" alt="KPSS Akademi" className="h-14 w-14 rounded-2xl" />
        <div>
          <p className="text-lg font-extrabold">KPSS Akademi</p>
          <p className="text-xs text-ink-400">Web sürümü {__APP_VERSION__} · kpssakademi.tr</p>
        </div>
      </div>

      {i && (
        <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Istatistik etiket="Soru" deger={sayi(i.sorular)} />
          <Istatistik etiket="Bilgi Kartı" deger={sayi(i.kartlar)} renk="text-violet-600" />
          <Istatistik etiket="Konu" deger={sayi(i.konular)} renk="text-emerald-600" />
          <Istatistik etiket="Deneme" deger={sayi(i.denemeler)} renk="text-amber-500" />
        </div>
      )}

      <div className="card space-y-4 p-5 text-sm leading-relaxed text-ink-600 dark:text-ink-300">
        <p>
          KPSS Akademi; soru bankası, bilgi kartları, deneme sınavları, coğrafya harita oyunları ve puan hesaplayıcıyı tek
          uygulamada toplayan ücretsiz bir KPSS hazırlık aracıdır.
        </p>
        <p>
          Web sürümü tarayıcıda çalışır, kurulum gerektirmez ve <b>çevrimdışı</b> kullanılabilir. Tarayıcınızın "Ana ekrana
          ekle" seçeneğiyle uygulama gibi kullanabilirsiniz.
        </p>
        <div>
          <h2 className="mb-1.5 text-base font-bold text-ink-900 dark:text-white">Neler var?</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Ders ve konu bazlı soru çözme, yanlış ve kayıtlı soru listeleri, kişisel notlar</li>
            <li>Çevir-öğren bilgi kartları ve sesli okuma</li>
            <li>Süreli deneme sınavları, KPSS puan türlerine göre tahmini puan ve ders bazlı analiz</li>
            <li>Hedef puan planlayıcı — hangi dersten kaç net gerektiğini gösterir</li>
            <li>Harita Avcısı, Kronoloji, Eşleştirme, Doğru mu?, Maraton oyunları</li>
            <li>Günlük/haftalık hedef takibi, çalışma serisi ve istatistikler</li>
          </ul>
        </div>
        <div>
          <h2 className="mb-1.5 text-base font-bold text-ink-900 dark:text-white">Telefonda kullanım</h2>
          {YAYINDA ? (
            <p>
              Aynı içerik Android uygulaması olarak da yayında:{' '}
              <a className="font-semibold text-brand-600" href={PLAY_ADRESI} target="_blank" rel="noreferrer">
                Google Play
              </a>
            </p>
          ) : (
            <p>
              Site telefona uygulama olarak kurulabilir. Tarayıcı menüsünden “Ana ekrana ekle” dediğinde
              kendi simgesiyle açılır, çevrimdışı da çalışır; ayrı bir uygulama indirmen gerekmez.
            </p>
          )}
        </div>
        <div>
          <h2 className="mb-1.5 text-base font-bold text-ink-900 dark:text-white">İçerik nasıl hazırlandı?</h2>
          <p>
            Sorular, cevap açıklamaları, bilgi kartları ve konu notları <b>yapay zekâ ile hazırlandı</b> ve ardından
            çok aşamalı bir denetimden geçirildi:
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            <li>
              Her soru, cevap anahtarı ve açıklaması gizlenerek <b>baştan yeniden çözüldü</b>; bulunan cevap bankadaki
              anahtarla karşılaştırıldı.
            </li>
            <li>
              Anahtarla çakışan ya da çözülemez bulunan sorular <b>daha güçlü bir modelle ikinci kez</b> incelendi;
              anahtarın mı yoksa çözümün mü hatalı olduğuna orada karar verildi.
            </li>
            <li>
              Doğru cevabı şıklarda bulunmayan, birden fazla doğru şıkkı olan ya da kendi içinde çelişen sorular
              <b> bankadan çıkarıldı</b>.
            </li>
          </ul>
          <p className="mt-2">
            Bu denetim hata oranını belirgin biçimde düşürür ama <b>sıfıra indirmez</b>. İçerik hiçbir resmî kurumun
            yayını değildir; hazırlanmasında yapay zekâ kullanıldığı için gözden kaçmış yanlış cevap, eksik ya da
            yanıltıcı açıklama bulunması mümkündür.
          </p>
        </div>
        <div>
          <h2 className="mb-1.5 text-base font-bold text-ink-900 dark:text-white">Sorumluluğun sınırı</h2>
          <p>
            İçerik yalnızca <b>çalışma ve alıştırma</b> amacıyla, olduğu gibi sunulmaktadır. Doğruluğu, güncelliği ve
            eksiksizliği konusunda bir garanti verilmez. Sınav hazırlığında, bir soruyu veya bilgiyi esas almadan önce
            <b> ÖSYM'nin resmî duyurularını ve yürürlükteki mevzuatı</b> kaynak alın; aradaki fark hâlinde resmî kaynak
            geçerlidir. İçeriğin kullanılmasından doğabilecek sonuçlardan kullanıcı sorumludur.
          </p>
          <p className="mt-2">
            Puan hesaplamaları geçmiş yıl istatistiklerinden türetilmiş <b>tahminlerdir</b>; ÖSYM'nin resmî sonucu
            farklılık gösterebilir. Sınav tarihleri ve kontenjan bilgileri de ÖSYM tarafından değiştirilebilir.
          </p>
          <p className="mt-2">
            Hatalı bulduğunuz bir soruyu, soru kartındaki <b>“Soruyu bildir”</b> bağlantısıyla iletebilirsiniz.
            Bildirilen her kayıt elden geçirilir; düzeltilenler sonraki güncellemede yayına alınır.
          </p>
        </div>
      </div>
    </>
  )
}
