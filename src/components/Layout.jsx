import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useSettings } from '../lib/settings.jsx'
import { cx } from '../lib/utils.js'
import MusicPlayer from './MusicPlayer.jsx'
import InstallPrompt from './InstallPrompt.jsx'
import KurulumBolumu from './KurulumBolumu.jsx'
import AndroidYakinda from './AndroidYakinda.jsx'
import CerezBildirimi from './CerezBildirimi.jsx'
import GuncellemeBildirimi from './GuncellemeBildirimi.jsx'
import {
  IconHome,
  IconBook,
  IconCards,
  IconExam,
  IconChart,
  IconMoon,
  IconSun,
  IconBack,
  IconSettings,
} from './Icons.jsx'

const NAV = [
  { to: '/', ad: 'Ana Sayfa', Ikon: IconHome, end: true },
  { to: '/dersler', ad: 'Dersler', Ikon: IconBook },
  { to: '/kartlar', ad: 'Kartlar', Ikon: IconCards },
  { to: '/denemeler', ad: 'Denemeler', Ikon: IconExam },
  { to: '/istatistik', ad: 'İstatistik', Ikon: IconChart },
]

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/90 backdrop-blur-lg dark:border-white/5 dark:bg-ink-950/90 lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-safe pt-1.5">
        {NAV.map(({ to, ad, Ikon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cx(
                'flex flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition',
                isActive ? 'text-brand-600 dark:text-brand-400' : 'text-ink-400 dark:text-ink-500'
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cx('rounded-lg px-3 py-1 transition', isActive && 'bg-brand-50 dark:bg-brand-500/15')}>
                  <Ikon size={21} />
                </span>
                {ad}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export function SideNav() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ink-100 bg-white px-3 py-5 dark:border-white/5 dark:bg-ink-950 lg:flex">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <img src="/icons/icon.svg" alt="" className="h-9 w-9 rounded-xl" />
        <div className="leading-tight">
          <p className="text-sm font-extrabold">KPSS Akademi</p>
          <p className="text-[11px] text-ink-400">kpssakademi.tr</p>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        {NAV.map(({ to, ad, Ikon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                  : 'text-ink-500 hover:bg-ink-50 dark:text-ink-400 dark:hover:bg-white/5'
              )
            }
          >
            <Ikon size={19} /> {ad}
          </NavLink>
        ))}
        <div className="my-2 h-px bg-ink-100 dark:bg-white/5" />
        {[
          { to: '/oyunlar', ad: 'Oyunlar' },
          { to: '/quiz', ad: 'Quiz' },
          { to: '/puan-hesapla', ad: 'Puan Hesapla' },
          { to: '/yanlislarim', ad: 'Yanlışlarım' },
          { to: '/kayitlilar', ad: 'Kayıtlılar' },
          { to: '/notlarim', ad: 'Notlarım' },
          { to: '/ayarlar', ad: 'Ayarlar' },
        ].map((x) => (
          <NavLink
            key={x.to}
            to={x.to}
            className={({ isActive }) =>
              cx(
                'rounded-xl px-3 py-2 text-sm transition',
                isActive ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300' : 'text-ink-500 hover:bg-ink-50 dark:hover:bg-white/5'
              )
            }
          >
            {x.ad}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}

export function Baslik({ baslik, altBaslik, geri = true, sag }) {
  const nav = useNavigate()
  return (
    <header className="sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-3 border-b border-ink-100 bg-ink-50/85 px-4 py-3 backdrop-blur-lg dark:border-white/5 dark:bg-ink-950/85">
      {geri && (
        <button onClick={() => nav(-1)} className="rounded-xl p-1.5 hover:bg-ink-100 dark:hover:bg-white/10" aria-label="Geri">
          <IconBack size={22} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-extrabold leading-tight">{baslik}</h1>
        {altBaslik && <p className="truncate text-xs text-ink-400">{altBaslik}</p>}
      </div>
      {sag}
    </header>
  )
}

export function TemaButonu() {
  const { theme, toggleTheme } = useSettings()
  return (
    <button
      onClick={toggleTheme}
      className="rounded-xl p-2 text-ink-500 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-white/10"
      aria-label="Temayı değiştir"
      title={theme === 'dark' ? 'Aydınlık mod' : 'Koyu mod'}
    >
      {theme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
    </button>
  )
}

export function AyarButonu() {
  const nav = useNavigate()
  return (
    <button
      onClick={() => nav('/ayarlar')}
      className="rounded-xl p-2 text-ink-500 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-white/10"
      aria-label="Ayarlar"
    >
      <IconSettings size={20} />
    </button>
  )
}

export default function Layout({ children }) {
  const { pathname } = useLocation()
  const tamEkran = /^\/(quiz\/oyna|deneme\/|oyun\/)/.test(pathname)

  return (
    <div className="flex min-h-full">
      {!tamEkran && <SideNav />}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* İçerik max-w-3xl (768 px) ile ortalandığı için kenar çubuğu ile
            içerik arasında boş bir şerit kalıyor; kurulum kartı oraya oturuyor.

            Şeridin genişliği = (ekran − 240 kenar çubuğu − 768 içerik) / 2.
            Kart ancak bu şeride SIĞDIĞINDA gösterilmeli, yoksa içeriğin
            üstüne biner:
              1400 px → şerit 196 px → 192 px'lik kart sığar
              1536 px → şerit 264 px → 240 px'lik geniş kart sığar
            Daha dar ekranlarda hiç gösterilmiyor; kart o ekranlarda mobil
            sürümüyle ana sayfanın sonunda duruyor. */}
        {!tamEkran && (
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-48 px-2 min-[1400px]:block 2xl:w-60 2xl:px-4">
            <div className="pointer-events-auto sticky top-6">
              <KurulumBolumu kompakt />
            </div>
          </div>
        )}
        {/* Sağdaki simetrik şerit — Android uygulaması duyurusu. */}
        {!tamEkran && (
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-48 px-2 min-[1400px]:block 2xl:w-60 2xl:px-4">
            <div className="pointer-events-auto sticky top-6">
              <AndroidYakinda />
            </div>
          </div>
        )}
        <main className={cx('mx-auto w-full max-w-3xl flex-1 px-4', tamEkran ? 'pb-6 pt-4' : 'pb-28 pt-4 lg:pb-10')}>{children}</main>
        {!tamEkran && <BottomNav />}
      </div>
      <MusicPlayer />
      <InstallPrompt />
      <CerezBildirimi />
      <GuncellemeBildirimi />
    </div>
  )
}
