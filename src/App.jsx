import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import { Yukleniyor } from './components/UI.jsx'

const Home = lazy(() => import('./pages/Home.jsx'))
const Dersler = lazy(() => import('./pages/Dersler.jsx'))
const DersDetay = lazy(() => import('./pages/DersDetay.jsx'))
const SoruCoz = lazy(() => import('./pages/SoruCoz.jsx'))
const KonuAnlatimi = lazy(() => import('./pages/KonuAnlatimi.jsx'))
const AnlatimListesi = lazy(() => import('./pages/KonuAnlatimi.jsx').then((m) => ({ default: m.AnlatimListesi })))
const Kartlar = lazy(() => import('./pages/Kartlar.jsx'))
const KartCalis = lazy(() => import('./pages/KartCalis.jsx'))
const Quiz = lazy(() => import('./pages/Quiz.jsx'))
const QuizOyna = lazy(() => import('./pages/QuizOyna.jsx'))
const Denemeler = lazy(() => import('./pages/Denemeler.jsx'))
const DenemeCoz = lazy(() => import('./pages/DenemeCoz.jsx'))
const Istatistik = lazy(() => import('./pages/Istatistik.jsx'))
const Oyunlar = lazy(() => import('./pages/Oyunlar.jsx'))
const OyunOyna = lazy(() => import('./pages/OyunOyna.jsx'))
const PuanHesapla = lazy(() => import('./pages/PuanHesapla.jsx'))
const Listeler = lazy(() => import('./pages/Listeler.jsx'))
const Ayarlar = lazy(() => import('./pages/Ayarlar.jsx'))
const Gizlilik = lazy(() => import('./pages/Gizlilik.jsx'))
const Iletisim = lazy(() => import('./pages/Iletisim.jsx'))
const Hakkinda = lazy(() => import('./pages/Hakkinda.jsx'))
const Bulunamadi = lazy(() => import('./pages/Bulunamadi.jsx'))

function BasaSar() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo({ top: 0 }), [pathname])
  return null
}

export default function App() {
  return (
    <Layout>
      <BasaSar />
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
    </Layout>
  )
}
