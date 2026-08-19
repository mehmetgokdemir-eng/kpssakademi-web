import { useMemo, useState } from 'react'
import { DERS_REFERANS, GRUPLAR, PUAN_TURLERI, kpssPuan, hedefIcinNet, netBasinaKatki, net as netHesap } from '../lib/kpss.js'
import { useProgress } from '../lib/hooks.js'
import { useSettings } from '../lib/settings.jsx'
import { cx } from '../lib/utils.js'
import { Baslik, TemaButonu } from '../components/Layout.jsx'
import { Sekmeler, Istatistik, Rozet } from '../components/UI.jsx'
import { YatayBar } from '../components/Grafik.jsx'
import { IconCalc, IconTarget } from '../components/Icons.jsx'

export default function PuanHesapla() {
  const { settings, set } = useSettings()
  const p = useProgress()
  const [sekme, setSekme] = useState('hesapla')
  const [puanTuru, setPuanTuru] = useState(settings.puanTuru || 'P3')
  const [oabt, setOabt] = useState(50)
  const [hedef, setHedef] = useState(85)

  const kullanilan = useMemo(
    () => Object.keys(PUAN_TURLERI[puanTuru].agirlik).flatMap((g) => GRUPLAR[g] || []),
    [puanTuru]
  )

  const [netler, setNetler] = useState(() =>
    Object.fromEntries(Object.keys(DERS_REFERANS).map((d) => [d, Math.round(DERS_REFERANS[d].ortalamaNet)]))
  )

  const sonuc = useMemo(
    () => kpssPuan(netler, puanTuru, puanTuru === 'P121' ? oabt : null),
    [netler, puanTuru, oabt]
  )

  const katkilar = useMemo(() => netBasinaKatki(puanTuru, netler), [puanTuru, netler])
  const hedefSonuc = useMemo(() => hedefIcinNet(hedef, puanTuru, {}), [hedef, puanTuru])

  /* Son denemelerden net doldur */
  const sonDeneme = p.denemeler?.[0]
  function denemedenDoldur() {
    if (!sonDeneme?.detay) return
    const yeni = { ...netler }
    for (const [dersId, d] of Object.entries(sonDeneme.detay)) {
      if (DERS_REFERANS[dersId]) yeni[dersId] = Math.round(netHesap(d.d, d.y))
    }
    setNetler(yeni)
  }

  return (
    <>
      <Baslik baslik="Puan Hesapla" altBaslik="KPSS puan tahmini ve hedef planlayıcı" geri={false} sag={<TemaButonu />} />

      <div className="mb-4">
        <Sekmeler
          aktif={sekme}
          degis={setSekme}
          sekmeler={[
            { id: 'hesapla', ad: 'Puan Hesapla' },
            { id: 'hedef', ad: 'Hedef Planı' },
          ]}
        />
      </div>

      <div className="mb-4">
        <h2 className="section-title mb-2">Puan türü</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PUAN_TURLERI).map(([id, t]) => (
            <button
              key={id}
              onClick={() => {
                setPuanTuru(id)
                set({ puanTuru: id })
              }}
              className={cx(
                'rounded-xl px-3.5 py-2 text-xs font-bold transition',
                puanTuru === id ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 dark:bg-white/5 dark:text-ink-300'
              )}
              title={t.ad}
            >
              {id}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-ink-400">{PUAN_TURLERI[puanTuru].ad}</p>
      </div>

      {sekme === 'hesapla' && (
        <>
          <div className="card mb-4 p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Tahmini {puanTuru} puanın</p>
            <p className="mt-1 text-5xl font-extrabold text-brand-600">{sonuc.puan.toFixed(3)}</p>
            <p className="mt-2 text-xs text-ink-400">
              Toplam net: {kullanilan.reduce((a, d) => a + (netler[d] || 0), 0).toFixed(1)}
            </p>
          </div>

          {sonDeneme && (
            <button className="btn-ghost mb-4 w-full" onClick={denemedenDoldur}>
              Son denemenden doldur ({sonDeneme.ad})
            </button>
          )}

          <h2 className="section-title mb-2">Netlerin</h2>
          <div className="mb-4 space-y-3">
            {kullanilan.map((d) => {
              const ref = DERS_REFERANS[d]
              return (
                <div key={d} className="card p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-bold">{ref.ad}</span>
                    <span className="text-sm font-extrabold tabular-nums text-brand-600">
                      {netler[d]} <span className="text-xs font-medium text-ink-400">/ {ref.soru}</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={ref.soru}
                    step="0.5"
                    value={netler[d]}
                    onChange={(e) => setNetler((n) => ({ ...n, [d]: Number(e.target.value) }))}
                    className="w-full accent-brand-600"
                  />
                  <p className="mt-1 text-[11px] text-ink-400">
                    Aday ortalaması ≈ {ref.ortalamaNet} net · standart sapma {ref.ss}
                  </p>
                </div>
              )
            })}

            {puanTuru === 'P121' && (
              <div className="card p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold">ÖABT başarı yüzdesi</span>
                  <span className="text-sm font-extrabold tabular-nums text-brand-600">%{oabt}</span>
                </div>
                <input type="range" min="0" max="100" value={oabt} onChange={(e) => setOabt(Number(e.target.value))} className="w-full accent-brand-600" />
              </div>
            )}
          </div>

          <div className="card p-4">
            <h2 className="mb-1 text-sm font-bold">1 net kaç puan kazandırır?</h2>
            <p className="mb-3 text-[11px] text-ink-400">
              Standart sapması yüksek dersler (özellikle Matematik) aynı nette daha fazla puan getirir.
            </p>
            <YatayBar veri={katkilar.map((k) => ({ ad: k.ad, deger: k.katki }))} birim=" puan" />
          </div>
        </>
      )}

      {sekme === 'hedef' && (
        <>
          <div className="card mb-4 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold">
                <IconTarget size={17} className="text-brand-600" /> Hedef puanın
              </span>
              <span className="text-lg font-extrabold tabular-nums text-brand-600">{hedef}</span>
            </div>
            <input type="range" min="60" max="95" step="0.5" value={hedef} onChange={(e) => setHedef(Number(e.target.value))} className="w-full accent-brand-600" />
          </div>

          <div className="card mb-4 p-5 text-center">
            {hedefSonuc.mumkun ? (
              <>
                <p className="text-sm text-ink-500">Bu net dağılımıyla ulaşabileceğin puan</p>
                <p className="mt-1 text-4xl font-extrabold text-emerald-600">{hedefSonuc.ulasilan.toFixed(2)}</p>
                <Rozet renk="yesil">Hedefe ulaşılabilir</Rozet>
              </>
            ) : (
              <>
                <p className="text-sm text-ink-500">Tüm soruları doğru yapsan bile ulaşılabilecek en yüksek puan</p>
                <p className="mt-1 text-4xl font-extrabold text-amber-500">{hedefSonuc.ulasilan.toFixed(2)}</p>
                <Rozet renk="turuncu">Hedef bu puan türü için çok yüksek</Rozet>
              </>
            )}
          </div>

          <h2 className="section-title mb-2">Önerilen net dağılımı</h2>
          <div className="space-y-2">
            {kullanilan.map((d) => {
              const ref = DERS_REFERANS[d]
              const n = hedefSonuc.netler[d] ?? 0
              return (
                <div key={d} className="card flex items-center justify-between p-3.5">
                  <div>
                    <p className="text-sm font-bold">{ref.ad}</p>
                    <p className="text-[11px] text-ink-400">
                      {ref.soru} soru · ortalamanın {n > ref.ortalamaNet ? `${(n - ref.ortalamaNet).toFixed(1)} net üstü` : 'altı'}
                    </p>
                  </div>
                  <p className="text-lg font-extrabold tabular-nums text-brand-600">{n.toFixed(1)}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Istatistik etiket="Toplam net" deger={kullanilan.reduce((a, d) => a + (hedefSonuc.netler[d] || 0), 0).toFixed(1)} />
            <Istatistik etiket="En verimli ders" deger={katkilar[0]?.ad || '—'} renk="text-emerald-600" />
          </div>
        </>
      )}

      <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-ink-100 p-3.5 text-[11px] leading-relaxed text-ink-500 dark:bg-white/5">
        <IconCalc size={16} className="mt-0.5 shrink-0" />
        <p>
          Bu hesaplama, geçmiş yıl sınav istatistiklerinden türetilmiş ortalama ve standart sapma değerlerine dayanan bir
          <b> tahmindir</b>. ÖSYM'nin resmî puanı, sınava giren tüm adayların gerçek dağılımına göre hesaplanır ve farklılık gösterebilir.
        </p>
      </div>
    </>
  )
}
