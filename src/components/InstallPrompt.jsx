import { useEffect, useState } from 'react'
import { IconInstall, IconClose } from './Icons.jsx'
import { ls } from '../lib/utils.js'

/* "Ana ekrana ekle" — PWA kurulum çubuğu. */
export default function InstallPrompt() {
  const [olay, setOlay] = useState(null)
  const [gizli, setGizli] = useState(() => ls.get('ka:install-dismissed', false))

  useEffect(() => {
    const h = (e) => {
      e.preventDefault()
      setOlay(e)
    }
    window.addEventListener('beforeinstallprompt', h)
    window.addEventListener('appinstalled', () => setOlay(null))
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  if (!olay || gizli) return null

  return (
    <div className="fixed inset-x-3 bottom-24 z-30 flex items-center gap-3 rounded-2xl border border-brand-200 bg-white p-3 shadow-lift dark:border-brand-500/30 dark:bg-ink-900 sm:left-auto sm:right-4 sm:w-80">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
        <IconInstall size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">Uygulamayı yükle</p>
        <p className="truncate text-xs text-ink-500">Çevrimdışı çalışır, ana ekranına eklenir.</p>
      </div>
      <button
        className="btn-primary !px-3 !py-1.5 !text-xs"
        onClick={async () => {
          olay.prompt()
          await olay.userChoice
          setOlay(null)
        }}
      >
        Yükle
      </button>
      <button
        className="rounded-lg p-1 text-ink-400"
        onClick={() => {
          setGizli(true)
          ls.set('ka:install-dismissed', true)
        }}
        aria-label="Kapat"
      >
        <IconClose size={16} />
      </button>
    </div>
  )
}
