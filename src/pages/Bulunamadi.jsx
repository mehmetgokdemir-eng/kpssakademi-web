import { Link } from 'react-router-dom'

export default function Bulunamadi() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <p className="mt-2 text-lg font-bold">Sayfa bulunamadı</p>
      <p className="mt-1 max-w-xs text-sm text-ink-500">Aradığın sayfa taşınmış ya da hiç var olmamış olabilir.</p>
      <Link to="/" className="btn-primary mt-5">
        Ana sayfaya dön
      </Link>
    </div>
  )
}
