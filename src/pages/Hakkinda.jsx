import { useAsync } from '../lib/hooks.js'
import { getIndex } from '../lib/data.js'
import { sayi } from '../lib/utils.js'
import { Baslik } from '../components/Layout.jsx'
import { Istatistik } from '../components/UI.jsx'

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
          <h2 className="mb-1.5 text-base font-bold text-ink-900 dark:text-white">Android sürümü</h2>
          <p>
            Aynı içerik Android uygulaması olarak da yayında:{' '}
            <a
              className="font-semibold text-brand-600"
              href="https://play.google.com/store/apps/details?id=com.nihangokdemir.kpss"
              target="_blank"
              rel="noreferrer"
            >
              Google Play
            </a>
          </p>
        </div>
        <p className="text-xs text-ink-400">
          Puan hesaplamaları geçmiş yıl istatistiklerinden türetilmiş tahminlerdir; ÖSYM'nin resmî sonucu farklılık
          gösterebilir.
        </p>
      </div>
    </>
  )
}
