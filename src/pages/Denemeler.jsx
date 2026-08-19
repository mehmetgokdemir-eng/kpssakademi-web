import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getDenemeler } from '../lib/data.js'
import { useAsync, useProgress } from '../lib/hooks.js'
import { sayi, tarihFormat, cx } from '../lib/utils.js'
import { Yukleniyor, Hata, Bos, Sekmeler, Rozet } from '../components/UI.jsx'
import { Baslik, TemaButonu } from '../components/Layout.jsx'
import { IconExam, IconChevron, IconClock, IconTrophy } from '../components/Icons.jsx'

export default function Denemeler() {
  const { veri, yukleniyor, hata, yenile } = useAsync(getDenemeler, [])
  const p = useProgress()
  const [sekme, setSekme] = useState('genel')

  if (yukleniyor) return <Yukleniyor satir={5} />
  if (hata) return <Hata hata={hata} yenile={yenile} />

  const genel = veri.filter((d) => d.tur === 'genel')
  const brans = veri.filter((d) => d.tur === 'brans')
  const liste = sekme === 'genel' ? genel : sekme === 'brans' ? brans : []

  const sonuclar = p.denemeler || []

  return (
    <>
      <Baslik baslik="Denemeler" altBaslik={`${veri.length} deneme sınavı`} geri={false} sag={<TemaButonu />} />

      <div className="mb-4">
        <Sekmeler
          aktif={sekme}
          degis={setSekme}
          sekmeler={[
            { id: 'genel', ad: 'Genel', sayi: genel.length },
            { id: 'brans', ad: 'Branş', sayi: brans.length },
            { id: 'gecmis', ad: 'Geçmiş', sayi: sonuclar.length },
          ]}
        />
      </div>

      {sekme === 'gecmis' ? (
        sonuclar.length ? (
          <div className="space-y-2.5">
            {sonuclar.map((s, i) => (
              <div key={i} className="card flex items-center gap-3.5 p-3.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15">
                  <IconTrophy size={21} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{s.ad}</p>
                  <p className="text-[11px] text-ink-400">
                    {tarihFormat(s.tarih)} · {s.dogru}D {s.yanlis}Y {s.bos}B · Net {s.net}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-brand-600">{s.puan?.toFixed(1)}</p>
                  <p className="text-[10px] text-ink-400">{s.puanTuru}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Bos baslik="Henüz deneme çözmedin" aciklama="Bir deneme sınavı çöz, sonucun burada birikir." ikon={<IconExam size={34} />} />
        )
      ) : liste.length ? (
        <div className="space-y-2.5">
          {liste.map((d) => {
            const oncekiler = sonuclar.filter((s) => s.denemeId === d.id)
            const enIyi = oncekiler.length ? Math.max(...oncekiler.map((s) => s.puan || 0)) : null
            return (
              <Link key={d.id} to={`/deneme/${d.id}`} className="card flex items-center gap-3.5 p-3.5 transition active:scale-[.99]">
                <span
                  className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white')}
                  style={{ background: d.renk || '#1f49f0' }}
                >
                  <IconExam size={21} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold">{d.ad}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-400">
                    <span>{sayi(d.soruSayisi)} soru</span>
                    <span className="inline-flex items-center gap-1">
                      <IconClock size={12} /> {d.sure} dk
                    </span>
                    {d.puanTuru && <Rozet renk="gri">{d.puanTuru}</Rozet>}
                    {enIyi != null && <Rozet renk="yesil">En iyi {enIyi.toFixed(1)}</Rozet>}
                  </p>
                </div>
                <IconChevron size={18} className="text-ink-300" />
              </Link>
            )
          })}
        </div>
      ) : (
        <Bos baslik="Bu kategoride deneme yok" ikon={<IconExam size={34} />} />
      )}
    </>
  )
}
