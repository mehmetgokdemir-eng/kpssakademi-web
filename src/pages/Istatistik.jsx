import { useMemo, useState } from 'react'
import { getDersler } from '../lib/data.js'
import { useAsync, useProgress } from '../lib/hooks.js'
import { genelIstatistik, sonNGun, dersIstatistik } from '../lib/storage.js'
import { useSettings } from '../lib/settings.jsx'
import { sayi, yuzde, sureFormat, tarihFormat } from '../lib/utils.js'
import { Yukleniyor, Hata, Istatistik as Kutu, Halka, Sekmeler, Bos, Rozet } from '../components/UI.jsx'
import { Baslik, TemaButonu } from '../components/Layout.jsx'
import { YatayBar, DikeyBar, Cizgi } from '../components/Grafik.jsx'
import { IconFlame, IconChart } from '../components/Icons.jsx'
import { seriRenk } from '../lib/palette.js'

const GUN_KISA = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']

export default function IstatistikSayfa() {
  const { veri: dersler, yukleniyor, hata, yenile } = useAsync(getDersler, [])
  const p = useProgress()
  const { theme, settings } = useSettings()
  const [sekme, setSekme] = useState('genel')

  const ist = genelIstatistik()
  const hafta = sonNGun(7)
  const haftaToplam = hafta.reduce((a, g) => a + g.soru, 0)
  const haftaSure = hafta.reduce((a, g) => a + g.sure, 0)

  const dersVerisi = useMemo(() => {
    if (!dersler) return []
    return dersler
      .map((d, i) => {
        const s = dersIstatistik(d.id)
        return { ad: d.ad, deger: s.toplam, altDeger: s.toplam ? s.oran : null, renk: d.renk || seriRenk(i, theme === 'dark'), ...s }
      })
      .filter((d) => d.deger > 0)
      .sort((a, b) => b.deger - a.deger)
  }, [dersler, p.cozulen, theme])

  const denemeVerisi = useMemo(
    () =>
      [...(p.denemeler || [])]
        .reverse()
        .slice(-12)
        .map((d) => ({ etiket: tarihFormat(d.tarih).slice(0, 6), deger: d.puan || 0 })),
    [p.denemeler]
  )

  if (yukleniyor) return <Yukleniyor satir={6} />
  if (hata) return <Hata hata={hata} yenile={yenile} />

  return (
    <>
      <Baslik baslik="İstatistik" altBaslik="Çalışma performansın" geri={false} sag={<TemaButonu />} />

      <div className="mb-4">
        <Sekmeler
          aktif={sekme}
          degis={setSekme}
          sekmeler={[
            { id: 'genel', ad: 'Genel Bakış' },
            { id: 'dersler', ad: 'Dersler' },
            { id: 'denemeler', ad: 'Denemeler' },
          ]}
        />
      </div>

      {sekme === 'genel' && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Kutu etiket="Çözülen Soru" deger={sayi(ist.toplam)} />
            <Kutu etiket="Doğru" deger={sayi(ist.dogru)} renk="text-emerald-600" />
            <Kutu etiket="Yanlış" deger={sayi(ist.yanlis)} renk="text-red-500" />
            <Kutu etiket="Başarı" deger={`%${ist.oran}`} renk="text-brand-600" />
          </div>

          <div className="card mb-4 flex items-center gap-5 p-4">
            <Halka deger={yuzde(haftaToplam, settings.haftalikHedef)} boyut={104} alt="haftalık" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Haftalık hedef</p>
              <p className="mt-0.5 text-xs text-ink-500">
                {sayi(haftaToplam)} / {sayi(settings.haftalikHedef)} soru
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Rozet renk="turuncu">
                  <IconFlame size={13} /> {ist.seri} gün seri
                </Rozet>
                <Rozet renk="gri">{sureFormat(haftaSure)} çalışma</Rozet>
                <Rozet renk="gri">{sayi(ist.kartBilinen)} kart</Rozet>
              </div>
            </div>
          </div>

          <div className="card mb-4 p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-sm font-bold">Son 7 gün · çözülen soru</h2>
              <span className="text-xs text-ink-400">günlük hedef {settings.gunlukHedef}</span>
            </div>
            <DikeyBar
              veri={hafta.map((g) => ({
                etiket: GUN_KISA[new Date(g.gun).getDay()],
                deger: g.soru,
                alt: g.soru ? `%${yuzde(g.dogru, g.soru)} doğru` : '',
              }))}
              etiketBicim={(d) => d.etiket}
            />
          </div>

          <div className="card p-4">
            <h2 className="mb-3 text-sm font-bold">Ders dağılımı</h2>
            <YatayBar veri={dersVerisi.slice(0, 8)} bosMetin="Soru çözmeye başladığında dağılım burada görünür." />
          </div>
        </>
      )}

      {sekme === 'dersler' && (
        <div className="space-y-2.5">
          {dersVerisi.length === 0 && <Bos baslik="Henüz veri yok" aciklama="Soru çözdükçe ders analizin burada oluşur." ikon={<IconChart size={34} />} />}
          {dersVerisi.map((d) => (
            <div key={d.ad} className="card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">{d.ad}</p>
                <span className="text-sm font-extrabold tabular-nums" style={{ color: d.renk }}>
                  %{d.oran}
                </span>
              </div>
              <div className="mt-2.5 flex h-2.5 gap-[2px] overflow-hidden rounded-full bg-ink-100 dark:bg-white/10">
                <div className="rounded-l-[4px] bg-emerald-500" style={{ width: `${yuzde(d.dogru, d.toplam)}%` }} />
                <div className="rounded-r-[4px] bg-red-500" style={{ width: `${yuzde(d.yanlis, d.toplam)}%` }} />
              </div>
              <p className="mt-1.5 text-[11px] text-ink-400">
                {sayi(d.toplam)} çözüldü · {sayi(d.dogru)} doğru · {sayi(d.yanlis)} yanlış
              </p>
            </div>
          ))}
        </div>
      )}

      {sekme === 'denemeler' &&
        (p.denemeler?.length ? (
          <>
            <div className="card mb-4 p-4">
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-sm font-bold">Deneme puan eğilimin</h2>
                <span className="text-xs text-ink-400">son {denemeVerisi.length} deneme</span>
              </div>
              <Cizgi veri={denemeVerisi} />
            </div>
            <div className="mb-4 grid grid-cols-3 gap-2.5">
              <Kutu etiket="Deneme" deger={p.denemeler.length} />
              <Kutu
                etiket="En Yüksek"
                deger={Math.max(...p.denemeler.map((d) => d.puan || 0)).toFixed(1)}
                renk="text-emerald-600"
              />
              <Kutu
                etiket="Ortalama"
                deger={(p.denemeler.reduce((a, d) => a + (d.puan || 0), 0) / p.denemeler.length).toFixed(1)}
                renk="text-brand-600"
              />
            </div>
            <div className="space-y-2">
              {p.denemeler.slice(0, 10).map((d, i) => (
                <div key={i} className="card flex items-center justify-between p-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{d.ad}</p>
                    <p className="text-[11px] text-ink-400">
                      {tarihFormat(d.tarih)} · Net {d.net} · {d.dogru}D {d.yanlis}Y {d.bos}B
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-extrabold text-brand-600">{d.puan?.toFixed(1)}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <Bos baslik="Deneme sonucu yok" aciklama="Deneme çözdükçe puan eğilimin burada oluşur." ikon={<IconChart size={34} />} />
        ))}
    </>
  )
}
