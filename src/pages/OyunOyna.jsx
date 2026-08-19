import { Suspense, lazy } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Yukleniyor, Bos } from '../components/UI.jsx'
import { Baslik } from '../components/Layout.jsx'
import { OYUNLAR } from './Oyunlar.jsx'

const BILESENLER = {
  harita: lazy(() => import('../games/HaritaAvcisi.jsx')),
  kronoloji: lazy(() => import('../games/Kronoloji.jsx')),
  eslestirme: lazy(() => import('../games/Eslestirme.jsx')),
  dogrumu: lazy(() => import('../games/DogruMu.jsx')),
  maraton: lazy(() => import('../games/Maraton.jsx')),
}

export default function OyunOyna() {
  const { oyunId } = useParams()
  const nav = useNavigate()
  const Bilesen = BILESENLER[oyunId]
  const meta = OYUNLAR.find((o) => o.id === oyunId)

  if (!Bilesen)
    return (
      <>
        <Baslik baslik="Oyun" />
        <Bos baslik="Oyun bulunamadı" aksiyon={<button className="btn-ghost mt-2" onClick={() => nav('/oyunlar')}>Oyunlara dön</button>} />
      </>
    )

  return (
    <div className="mx-auto max-w-2xl">
      <Baslik baslik={meta?.ad || 'Oyun'} altBaslik={meta?.aciklama} />
      <Suspense fallback={<Yukleniyor satir={4} />}>
        <Bilesen />
      </Suspense>
    </div>
  )
}
