import { Link } from 'react-router-dom'
import { Baslik } from '../components/Layout.jsx'
import { IconLink, IconBulb, IconExam } from '../components/Icons.jsx'

/* Çıkmış Sorular — Android'deki CikmisSorularActivity'nin karşılığı.
 *
 * Dürüstlük notu: ÖSYM çıkmış soruları telif kapsamındadır ve uygulama
 * içine kopyalanamaz. Android sürümü de kopyalamıyor, ÖSYM'nin kendi
 * arşivine yönlendiriyor. Burada aynısı yapılıyor: bağlantılar resmî
 * kaynağa gider, uygulama kendi soru bankasını sunar. */

const ARSIV = [
  {
    ad: 'ÖSYM Çıkmış Sorular Arşivi',
    aciklama: 'Tüm sınavların soru kitapçıkları ve cevap anahtarları — resmî kaynak.',
    url: 'https://www.osym.gov.tr/TR,8797/cikmis-sorular.html',
    ana: true,
  },
  {
    ad: 'ÖSYM Ana Sayfa',
    aciklama: 'Sınav takvimi, kılavuzlar ve duyurular.',
    url: 'https://www.osym.gov.tr/',
  },
  {
    ad: 'ÖSYM Aday İşlemleri (AİS)',
    aciklama: 'Başvuru, sınav giriş belgesi ve sonuç görüntüleme.',
    url: 'https://ais.osym.gov.tr/',
  },
  {
    ad: 'KPSS Kılavuzları',
    aciklama: 'Soru dağılımı, puan türleri ve başvuru şartlarının resmî metni.',
    url: 'https://www.osym.gov.tr/TR,8788/kilavuzlar.html',
  },
]

export default function CikmisSorular() {
  return (
    <>
      <Baslik baslik="Çıkmış Sorular" altBaslik="ÖSYM resmî arşivi" />

      <div className="card mb-4 border-l-4 !border-l-amber-400 p-4">
        <div className="flex gap-3">
          <IconBulb size={20} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-bold">Neden uygulamanın içinde değil?</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
              ÖSYM'nin çıkmış soruları telif hakkıyla korunuyor; başka bir uygulamaya kopyalanamaz. Bu yüzden
              buradan resmî arşive yönlendiriyoruz. KPSS Akademi'nin kendi{' '}
              <b>16.066 soruluk bankası</b> ise aynı konu dağılımıyla hazırlandı ve tamamı açıklamalı.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {ARSIV.map((a) => (
          <a
            key={a.url}
            href={a.url}
            target="_blank"
            rel="noreferrer"
            className={`card flex items-start gap-3 p-4 transition hover:border-brand-400 ${a.ana ? '!border-brand-300 !bg-brand-50/60 dark:!bg-brand-500/10' : ''}`}
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
              <IconLink size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{a.ad}</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-500 dark:text-ink-400">{a.aciklama}</p>
              <p className="mt-1 truncate text-[11px] text-ink-400">{a.url.replace(/^https?:\/\//, '')}</p>
            </div>
          </a>
        ))}
      </div>

      <div className="card mt-4 p-4 text-center">
        <p className="text-sm font-bold">Gerçek sınav düzeninde çalış</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
          64 deneme sınavı, gerçek soru dağılımı ve süreleriyle hazır: 120 soru / 130 dakika.
        </p>
        <Link className="btn-primary mt-3 w-full" to="/denemeler">
          <IconExam size={17} /> Denemelere Git
        </Link>
      </div>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-400">
        KPSS Akademi bağımsız bir çalışma aracıdır; ÖSYM ile resmî bir bağlantısı yoktur.
      </p>
    </>
  )
}
