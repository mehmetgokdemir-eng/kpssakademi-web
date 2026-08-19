import { Suspense, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import HataSiniri, { sayfaYukleyici as sayfa } from './components/HataSiniri.jsx'
import { Yukleniyor } from './components/UI.jsx'
import OtomatikReklamKontrol from './lib/otomatikReklam.js'
import Onboarding from './components/Onboarding.jsx'


const Home = sayfa(() => import('./pages/Home.jsx'))
const Dersler = sayfa(() => import('./pages/Dersler.jsx'))
const DersDetay = sayfa(() => import('./pages/DersDetay.jsx'))
const SoruCoz = sayfa(() => import('./pages/SoruCoz.jsx'))
const KonuAnlatimi = sayfa(() => import('./pages/KonuAnlatimi.jsx'))
const AnlatimListesi = sayfa(() =>
  import('./pages/KonuAnlatimi.jsx').then((m) => ({
    default: m.AnlatimListesi,
  })),
)
const Kartlar = sayfa(() => import('./pages/Kartlar.jsx'))
const KartCalis = sayfa(() => import('./pages/KartCalis.jsx'))
const Quiz = sayfa(() => import('./pages/Quiz.jsx'))
const QuizOyna = sayfa(() => import('./pages/QuizOyna.jsx'))
const Denemeler = sayfa(() => import('./pages/Denemeler.jsx'))
const DenemeCoz = sayfa(() => import('./pages/DenemeCoz.jsx'))
const Istatistik = sayfa(() => import('./pages/Istatistik.jsx'))
const Oyunlar = sayfa(() => import('./pages/Oyunlar.jsx'))
const OyunOyna = sayfa(() => import('./pages/OyunOyna.jsx'))
const PuanHesapla = sayfa(() => import('./pages/PuanHesapla.jsx'))
const Listeler = sayfa(() => import('./pages/Listeler.jsx'))
const Ayarlar = sayfa(() => import('./pages/Ayarlar.jsx'))
const Gizlilik = sayfa(() => import('./pages/Gizlilik.jsx'))
const Iletisim = sayfa(() => import('./pages/Iletisim.jsx'))
const Hakkinda = sayfa(() => import('./pages/Hakkinda.jsx'))
const Arama = sayfa(() => import('./pages/Arama.jsx'))
const Tekrar = sayfa(() => import('./pages/Tekrar.jsx'))
const HizliCalisma = sayfa(() => import('./pages/HizliCalisma.jsx'))
const Analiz = sayfa(() => import('./pages/Analiz.jsx'))
const HedefPuan = sayfa(() => import('./pages/HedefPuan.jsx'))
const Odak = sayfa(() => import('./pages/Odak.jsx'))
const CikmisSorular = sayfa(() => import('./pages/CikmisSorular.jsx'))
const Bulunamadi = sayfa(() => import('./pages/Bulunamadi.jsx'))

function BasaSar() {
  const { pathname } = useLocation()
  /* DİKKAT — gövde SÜSLÜ PARANTEZLİ olmalı.
     Eskiden `useEffect(() => window.scrollTo({ top: 0 }), [pathname])` yazıyordu.
     Kısa gövdeli ok fonksiyonu, çağrının DÖNÜŞ DEĞERİNİ döndürür; React da bir
     efektten dönen her şeyi "temizleme fonksiyonu" sayıp bir sonraki çalıştırmada
     ÇAĞIRIR. window.scrollTo normalde undefined döner, ama üçüncü taraf betikler
     (reklam/analitik etiketleri) bu yöntemi sarmalayıp değer döndürebiliyor.
     O zaman React fonksiyon olmayan bir şeyi çağırmaya çalışıyor:
       Uncaught TypeError: l is not a function
     ve hata temizleme aşamasında olduğu için TÜM AĞAÇ sökülüyor — ekran bomboş.
     Efekt her yol değişiminde çalıştığı için belirti tam olarak şuydu: ilk
     tıklamada boş, geri/ileri'de boş, sayfa yenilenince düzgün. */
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <Layout>
      <BasaSar />
      {/* Otomatik reklamların oyun / soru / sınav ekranlarına düşmesini engeller */}
      <OtomatikReklamKontrol />
      <Onboarding />
      {/* HataSiniri, Suspense'in DIŞINDA olmalı: yakalanacak hata parçayı
          indirme hatası ve o hata Suspense'in içinden fırlıyor. */}
      <HataSiniri>
        <Suspense fallback={<Yukleniyor satir={4} />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dersler" element={<Dersler />} />
            <Route path="/ders/:dersId" element={<DersDetay />} />
            <Route path="/ders/:dersId/konu/:konuId" element={<SoruCoz />} />
            <Route path="/ders/:dersId/anlatim" element={<AnlatimListesi />} />
            <Route path="/ders/:dersId/anlatim/:konuId" element={<KonuAnlatimi />} />
            <Route path="/kartlar" element={<Kartlar />} />
            <Route path="/kartlar/:dersId" element={<KartCalis />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/quiz/oyna" element={<QuizOyna />} />
            <Route path="/denemeler" element={<Denemeler />} />
            <Route path="/deneme/:denemeId" element={<DenemeCoz />} />
            <Route path="/istatistik" element={<Istatistik />} />
            <Route path="/arama" element={<Arama />} />
            <Route path="/tekrar" element={<Tekrar />} />
            <Route path="/hizli" element={<HizliCalisma />} />
            <Route path="/analiz" element={<Analiz />} />
            <Route path="/hedef" element={<HedefPuan />} />
            <Route path="/odak" element={<Odak />} />
            <Route path="/cikmis-sorular" element={<CikmisSorular />} />
            <Route path="/oyunlar" element={<Oyunlar />} />
            <Route path="/oyun/:oyunId" element={<OyunOyna />} />
            <Route path="/puan-hesapla" element={<PuanHesapla />} />
            <Route path="/yanlislarim" element={<Listeler tur="yanlislar" />} />
            <Route path="/kayitlilar" element={<Listeler tur="kayitlilar" />} />
            <Route path="/notlarim" element={<Listeler tur="notlar" />} />
            <Route path="/ayarlar" element={<Ayarlar />} />
            <Route path="/gizlilik" element={<Gizlilik />} />
            <Route path="/iletisim" element={<Iletisim />} />
            <Route path="/hakkinda" element={<Hakkinda />} />
            <Route path="/index.html" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Bulunamadi />} />
          </Routes>
        </Suspense>
      </HataSiniri>
    </Layout>
  )
}
