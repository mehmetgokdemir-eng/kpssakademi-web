import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDersler, getBilgiler } from '../lib/data.js'
import { useAsync, useProgress, useTicker } from '../lib/hooks.js'
import { useSettings, sinavBilgisi } from '../lib/settings.jsx'
import { genelIstatistik, bugun } from '../lib/storage.js'
import { geriSayim, sayi, yuzde, cx } from '../lib/utils.js'
import { Halka, Yukleniyor, Hata, Rozet } from '../components/UI.jsx'
import { TemaButonu, AyarButonu } from '../components/Layout.jsx'
import Reklam from '../components/Reklam.jsx'
import DegerlendirmeIstegi from '../components/DegerlendirmeIstegi.jsx'
import KurulumBolumu from '../components/KurulumBolumu.jsx'
import {
  DersIkon,
  IconWrong,
  IconBookmark,
  IconNote,
  IconBulb,
  IconFlame,
  IconQuiz,
  IconExam,
  IconGame,
  IconCalc,
  IconChevron,
} from '../components/Icons.jsx'

function Karsilama() {
  const { settings, set } = useSettings()
  const [duzenle, setDuzenle] = useState(false)
  const [ad, setAd] = useState(settings.ad)
  const saat = new Date().getHours()
  const selam = saat < 6 ? 'İyi geceler' : saat < 12 ? 'Günaydın' : saat < 18 ? 'İyi günler' : 'İyi akşamlar'

  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-ink-400">{selam}</p>
        {duzenle || !settings.ad ? (
          <form
            className="mt-1 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              set({ ad: ad.trim() })
              setDuzenle(false)
            }}
          >
            <input className="input !py-1.5 !text-sm" placeholder="Adın" value={ad} onChange={(e) => setAd(e.target.value)} autoFocus={duzenle} />
            <button className="btn-primary !px-3 !py-1.5 !text-xs">Kaydet</button>
          </form>
        ) : (
          <button onClick={() => setDuzenle(true)} className="text-xl font-extrabold leading-tight">
            Merhaba, {settings.ad} 👋
          </button>
        )}
      </div>
      <div className="flex shrink-0 items-center">
        <TemaButonu />
        <AyarButonu />
      </div>
    </div>
  )
}

function GeriSayim() {
  const { settings } = useSettings()
  useTicker(true, 1000)
  const { tarih: hedef, kaynak, ad: sinavAdi } = sinavBilgisi(settings)
  const { gun, saat, dakika, saniye, bitti } = geriSayim(hedef)
  const kutu = (v, e) => (
    <div className="flex flex-col items-center">
      <span className="min-w-[2.6rem] rounded-lg bg-white/15 px-2 py-1.5 text-center text-lg font-extrabold tabular-nums">
        {String(v).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide opacity-75">{e}</span>
    </div>
  )
  return (
    <Link
      to="/ayarlar"
      className="mb-4 block overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 p-4 text-white shadow-lift"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
            {kaynak === 'kullanici' ? 'Sınavına kalan süre' : `${sinavAdi} sınavına kalan süre`}
          </p>
          <p className="text-sm font-bold">
            {hedef.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            {kaynak === 'tahmin' && <span className="ml-1.5 font-medium opacity-75">(tahmini)</span>}
          </p>
        </div>
        {bitti ? (
          <span className="text-sm font-bold">Başarılar! 🎓</span>
        ) : (
          <div className="flex gap-1.5">
            {kutu(gun, 'gün')}
            {kutu(saat, 'saat')}
            {kutu(dakika, 'dk')}
            {kutu(saniye, 'sn')}
          </div>
        )}
      </div>
    </Link>
  )
}

function HizliErisim() {
  const p = useProgress()
  const ogeler = [
    { to: '/yanlislarim', ad: 'Yanlışlar', sayi: Object.keys(p.yanlislar).length, Ikon: IconWrong, renk: 'text-red-500 bg-red-50 dark:bg-red-500/15' },
    { to: '/kayitlilar', ad: 'Kayıtlılar', sayi: Object.keys(p.kayitlilar).length, Ikon: IconBookmark, renk: 'text-brand-600 bg-brand-50 dark:bg-brand-500/15' },
    { to: '/notlarim', ad: 'Notlarım', sayi: Object.keys(p.notlar).length, Ikon: IconNote, renk: 'text-amber-500 bg-amber-50 dark:bg-amber-500/15' },
  ]
  return (
    <div className="mb-4 grid grid-cols-3 gap-2.5">
      {ogeler.map(({ to, ad, sayi: n, Ikon, renk }) => (
        <Link key={to} to={to} className="card flex flex-col items-center gap-1.5 p-3 transition active:scale-[.97]">
          <span className={cx('grid h-9 w-9 place-items-center rounded-xl', renk)}>
            <Ikon size={19} />
          </span>
          <span className="text-xs font-bold">{ad}</span>
          <span className="text-[11px] text-ink-400">{n}</span>
        </Link>
      ))}
    </div>
  )
}

function GunlukHedef() {
  const p = useProgress()
  const { settings } = useSettings()
  const g = p.gunluk[bugun()] || { soru: 0, dogru: 0 }
  const oran = yuzde(g.soru, settings.gunlukHedef)
  const ist = genelIstatistik()
  return (
    <div className="card mb-4 flex items-center gap-4 p-4">
      <Halka deger={oran} alt="hedef" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">Günlük hedef</p>
        <p className="mt-0.5 text-xs text-ink-500">
          Bugün <b className="text-ink-900 dark:text-ink-100">{g.soru}</b> / {settings.gunlukHedef} soru
          {g.soru > 0 && <> · %{yuzde(g.dogru, g.soru)} doğru</>}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Rozet renk="turuncu">
            <IconFlame size={13} /> {ist.seri} günlük seri
          </Rozet>
          <Rozet renk="gri">Toplam {sayi(ist.toplam)} soru</Rozet>
        </div>
      </div>
    </div>
  )
}

function BilgiKarti() {
  const { veri } = useAsync(() => getBilgiler().catch(() => []), [])
  const bilgi = useMemo(() => {
    if (!veri?.length) return null
    const gun = Math.floor(Date.now() / 864e5)
    return veri[gun % veri.length]
  }, [veri])
  if (!bilgi) return null
  return (
    <div className="card mb-4 flex gap-3 border-l-4 !border-l-amber-400 p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-500/15">
        <IconBulb size={19} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">Bunu biliyor muydun?</p>
        <p className="mt-1 text-sm leading-relaxed">{bilgi.metin}</p>
        {bilgi.ders && <p className="mt-1 text-[11px] text-ink-400">{bilgi.ders}</p>}
      </div>
    </div>
  )
}

function KisayolSatiri() {
  const ogeler = [
    { to: '/quiz', ad: 'Quiz', Ikon: IconQuiz, renk: 'from-violet-500 to-violet-700' },
    { to: '/denemeler', ad: 'Denemeler', Ikon: IconExam, renk: 'from-emerald-500 to-emerald-700' },
    { to: '/oyunlar', ad: 'Oyunlar', Ikon: IconGame, renk: 'from-pink-500 to-rose-700' },
    { to: '/puan-hesapla', ad: 'Puan Hesapla', Ikon: IconCalc, renk: 'from-sky-500 to-sky-700' },
  ]
  return (
    <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {ogeler.map(({ to, ad, Ikon, renk }) => (
        <Link
          key={to}
          to={to}
          className={cx('flex items-center gap-2.5 rounded-2xl bg-gradient-to-br p-3.5 text-white shadow-card transition active:scale-[.97]', renk)}
        >
          <Ikon size={20} />
          <span className="text-sm font-bold">{ad}</span>
        </Link>
      ))}
    </div>
  )
}

function DerslerGrid() {
  const { veri: dersler, yukleniyor, hata, yenile } = useAsync(getDersler, [])
  const p = useProgress()

  if (yukleniyor) return <Yukleniyor satir={3} />
  if (hata) return <Hata hata={hata} yenile={yenile} />

  const cozulenSayisi = (dersId) => Object.values(p.cozulen).filter((v) => v.dersId === dersId).length

  return (
    <>
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="section-title">Dersler</h2>
        <Link to="/dersler" className="flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400">
          Tümü <IconChevron size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {dersler.map((d) => {
          const c = cozulenSayisi(d.id)
          return (
            <Link key={d.id} to={`/ders/${d.id}`} className="card group relative overflow-hidden p-3.5 transition active:scale-[.97]">
              <span
                className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-10 transition group-hover:opacity-20"
                style={{ background: d.renk }}
              />
              <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: d.renk }}>
                <DersIkon ikon={d.ikon || d.id} size={22} />
              </span>
              <p className="mt-2.5 text-sm font-bold leading-tight">{d.ad}</p>
              <p className="text-[11px] text-ink-400">{sayi(d.soruSayisi)} soru</p>
              {c > 0 && (
                <p className="mt-1.5 text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                  {sayi(c)} çözüldü · %{yuzde(c, d.soruSayisi)}
                </p>
              )}
            </Link>
          )
        })}
      </div>
    </>
  )
}

export default function Home() {
  return (
    <div>
      <Karsilama />
      <GeriSayim />
      <HizliErisim />
      <GunlukHedef />
      <BilgiKarti />
      <DegerlendirmeIstegi />
      <KisayolSatiri />
      <KurulumBolumu />
      <DerslerGrid />
      <Reklam yer="anaSayfa" />
      <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pb-2 text-[11px] text-ink-400">
        <Link to="/hakkinda" className="hover:text-brand-600">
          Hakkında
        </Link>
        <Link to="/gizlilik" className="hover:text-brand-600">
          Gizlilik
        </Link>
        <Link to="/iletisim" className="hover:text-brand-600">
          İletişim
        </Link>
        <a href="https://play.google.com/store/apps/details?id=com.nihangokdemir.kpss" target="_blank" rel="noreferrer" className="hover:text-brand-600">
          Android uygulaması
        </a>
        <span>© {new Date().getFullYear()} KPSS Akademi</span>
      </footer>
    </div>
  )
}
