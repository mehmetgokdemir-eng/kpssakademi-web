import { Link } from 'react-router-dom'
import { getDersler } from '../lib/data.js'
import { useAsync, useProgress } from '../lib/hooks.js'
import { dersIstatistik } from '../lib/storage.js'
import { sayi, yuzde } from '../lib/utils.js'
import { Yukleniyor, Hata, Ilerleme } from '../components/UI.jsx'
import { Baslik, TemaButonu } from '../components/Layout.jsx'
import { DersIkon, IconChevron } from '../components/Icons.jsx'
import Reklam from '../components/Reklam.jsx'

const GRUP_ADI = {
  gy: 'Genel Yetenek',
  gk: 'Genel Kültür',
  eb: 'Eğitim Bilimleri',
  ab: 'Alan Bilgisi',
}

export default function Dersler() {
  const { veri, yukleniyor, hata, yenile } = useAsync(getDersler, [])
  useProgress()

  if (yukleniyor)
    return (
      <>
        <Baslik baslik="Dersler" geri={false} sag={<TemaButonu />} />
        <Yukleniyor satir={6} />
      </>
    )
  if (hata) return <Hata hata={hata} yenile={yenile} />

  const gruplar = veri.reduce((acc, d) => {
    const g = d.grup || 'gk'
    ;(acc[g] ||= []).push(d)
    return acc
  }, {})

  return (
    <>
      <Baslik baslik="Dersler" altBaslik={`${sayi(veri.reduce((a, d) => a + (d.soruSayisi || 0), 0))} soru`} geri={false} sag={<TemaButonu />} />
      <div className="space-y-6">
        {Object.entries(gruplar).map(([g, dersler]) => (
          <section key={g}>
            <h2 className="section-title mb-2.5">{GRUP_ADI[g] || g}</h2>
            <div className="space-y-2.5">
              {dersler.map((d) => {
                const ist = dersIstatistik(d.id)
                return (
                  <Link key={d.id} to={`/ders/${d.id}`} className="card flex items-center gap-3.5 p-3.5 transition active:scale-[.99]">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white" style={{ background: d.renk }}>
                      <DersIkon ikon={d.ikon || d.id} size={23} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold">{d.ad}</p>
                      <p className="text-[11px] text-ink-400">
                        {sayi(d.soruSayisi)} soru · {sayi(d.konuSayisi || 0)} konu
                        {d.kartSayisi ? ` · ${sayi(d.kartSayisi)} kart` : ''}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Ilerleme deger={ist.toplam} toplam={d.soruSayisi || 1} ince />
                        <span className="shrink-0 text-[11px] font-semibold tabular-nums text-ink-400">
                          %{yuzde(ist.toplam, d.soruSayisi || 1)}
                        </span>
                      </div>
                    </div>
                    <IconChevron size={18} className="shrink-0 text-ink-300" />
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>
      <Reklam yer="dersListesi" />
    </>
  )
}
