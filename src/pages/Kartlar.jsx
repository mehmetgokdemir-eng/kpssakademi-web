import { Link } from 'react-router-dom'
import { getDersler } from '../lib/data.js'
import { useAsync, useProgress } from '../lib/hooks.js'
import { sayi } from '../lib/utils.js'
import { Yukleniyor, Hata, Bos } from '../components/UI.jsx'
import { Baslik, TemaButonu } from '../components/Layout.jsx'
import { DersIkon, IconChevron, IconCards } from '../components/Icons.jsx'

export default function Kartlar() {
  const { veri, yukleniyor, hata, yenile } = useAsync(getDersler, [])
  const p = useProgress()

  if (yukleniyor) return <Yukleniyor satir={5} />
  if (hata) return <Hata hata={hata} yenile={yenile} />

  const kartliDersler = veri.filter((d) => (d.kartSayisi || 0) > 0)
  const toplamKart = kartliDersler.reduce((a, d) => a + d.kartSayisi, 0)
  const bilinen = Object.values(p.kartlar).filter((k) => k.bilinen).length

  return (
    <>
      <Baslik
        baslik="Bilgi Kartları"
        altBaslik={`${sayi(toplamKart)} kart · ${sayi(bilinen)} tamamlandı`}
        geri={false}
        sag={<TemaButonu />}
      />

      {kartliDersler.length === 0 ? (
        <Bos baslik="Kart bulunamadı" aciklama="Veri klasörüne kart dosyaları eklendiğinde burada görünür." ikon={<IconCards size={34} />} />
      ) : (
        <>
          <Link to="/kartlar/karisik" className="mb-4 flex items-center gap-3.5 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-800 p-4 text-white shadow-lift">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/20">
              <IconCards size={22} />
            </span>
            <div className="flex-1">
              <p className="font-bold">Karışık Kartlar</p>
              <p className="text-xs opacity-85">Tüm derslerden rastgele kart çevir</p>
            </div>
            <IconChevron size={18} />
          </Link>

          <div className="space-y-2.5">
            {kartliDersler.map((d) => (
              <Link key={d.id} to={`/kartlar/${d.id}`} className="card flex items-center gap-3.5 p-3.5 transition active:scale-[.99]">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white" style={{ background: d.renk }}>
                  <DersIkon ikon={d.ikon || d.id} size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold">{d.ad}</p>
                  <p className="text-[11px] text-ink-400">{sayi(d.kartSayisi)} bilgi kartı</p>
                </div>
                <IconChevron size={18} className="text-ink-300" />
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  )
}
