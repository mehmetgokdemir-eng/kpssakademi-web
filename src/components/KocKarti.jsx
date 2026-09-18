import { Link } from 'react-router-dom'
import { useProgress } from '../lib/hooks.js'
import { useSettings } from '../lib/settings.jsx'
import { bugun, tekrarOzet } from '../lib/storage.js'
import { kocMesaji } from '../lib/kocluk.js'
import { cx } from '../lib/utils.js'
import { IconBulb, IconChevron, IconFlame, IconRefresh, IconTarget } from '../components/Icons.jsx'

/* Koç kartı — ana sayfanın en üstünde, o an ne yapılması gerektiğini söyler.
 *
 * Tek mesaj gösterir. Üst üste üç uyarı vermek koç değil pano hissi yaratır;
 * hangisinin gösterileceğine lib/kocluk.js karar verir (ara verdiyse
 * karşılama, tekrar varsa tekrar, hedef bittiyse tebrik...). */

const RENK = {
  yeni: { kap: 'border-l-brand-500', ikon: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15', I: IconBulb },
  ara: { kap: 'border-l-amber-500', ikon: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15', I: IconRefresh },
  tekrar: { kap: 'border-l-amber-500', ikon: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15', I: IconRefresh },
  tamam: { kap: 'border-l-emerald-500', ikon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15', I: IconFlame },
  devam: { kap: 'border-l-brand-500', ikon: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15', I: IconTarget },
  gunluk: { kap: 'border-l-brand-500', ikon: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15', I: IconTarget },
}

export default function KocKarti() {
  const p = useProgress()
  const { settings } = useSettings()
  const ozet = tekrarOzet()
  const g = p.gunluk[bugun()] || { soru: 0 }

  const koc = kocMesaji({
    gunluk: p.gunluk,
    cozulen: p.cozulen,
    tekrarSayisi: ozet.bugun || 0,
    bugunSoru: g.soru,
    gunlukHedef: settings.gunlukHedef,
    seri: p.seri?.gun || 0,
  })

  const stil = RENK[koc.tur] || RENK.gunluk
  const I = stil.I

  return (
    <Link to={koc.aksiyon.yol} className={cx('card mb-4 flex items-center gap-3 border-l-4 p-4 hover:border-brand-300', stil.kap)}>
      <span className={cx('shrink-0 rounded-xl p-2.5', stil.ikon)}>
        <I size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{koc.baslik}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">{koc.metin}</p>
        <span className="mt-1.5 inline-block text-xs font-semibold text-brand-600">{koc.aksiyon.ad} →</span>
      </div>
      <IconChevron size={18} className="shrink-0 text-ink-300" />
    </Link>
  )
}
