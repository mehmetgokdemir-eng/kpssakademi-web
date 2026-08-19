import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDersler } from '../lib/data.js'
import { useAsync, useProgress } from '../lib/hooks.js'
import { cx, sayi } from '../lib/utils.js'
import { Yukleniyor, Hata, Istatistik } from '../components/UI.jsx'
import { Baslik, TemaButonu } from '../components/Layout.jsx'
import { DersIkon, IconQuiz, IconTrophy } from '../components/Icons.jsx'

const ADETLER = [5, 10, 20, 30, 50]

export default function Quiz() {
  const nav = useNavigate()
  const p = useProgress()
  const { veri: dersler, yukleniyor, hata, yenile } = useAsync(getDersler, [])
  const [secili, setSecili] = useState([])
  const [adet, setAdet] = useState(10)
  const [sadeceCozulmemis, setSadeceCozulmemis] = useState(true)

  if (yukleniyor) return <Yukleniyor satir={5} />
  if (hata) return <Hata hata={hata} yenile={yenile} />

  const tumu = secili.length === 0
  const toggle = (id) => setSecili((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const basla = () => {
    const params = new URLSearchParams({
      dersler: (secili.length ? secili : dersler.map((d) => d.id)).join(','),
      adet: String(adet),
      yeni: sadeceCozulmemis ? '1' : '0',
    })
    nav(`/quiz/oyna?${params}`)
  }

  return (
    <>
      <Baslik baslik="Quiz" altBaslik="Karışık sorularla hızlı test" geri={false} sag={<TemaButonu />} />

      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <Istatistik etiket="Quiz Puanın" deger={sayi(p.quiz.puan)} renk="text-violet-600" />
        <Istatistik etiket="Çözdüğün Quiz" deger={sayi(p.quiz.oynanan)} />
      </div>

      <h2 className="section-title mb-2">Dersler</h2>
      <p className="mb-2.5 text-xs text-ink-400">Hiçbirini seçmezsen tüm derslerden karışık gelir.</p>
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {dersler.map((d) => {
          const aktif = secili.includes(d.id)
          return (
            <button
              key={d.id}
              onClick={() => toggle(d.id)}
              className={cx(
                'flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition active:scale-[.97]',
                aktif ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-ink-200 dark:border-white/10'
              )}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white" style={{ background: d.renk }}>
                <DersIkon ikon={d.ikon || d.id} size={17} />
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-bold">{d.ad}</span>
            </button>
          )
        })}
      </div>

      <h2 className="section-title mb-2">Soru sayısı</h2>
      <div className="mb-5 flex flex-wrap gap-2">
        {ADETLER.map((a) => (
          <button
            key={a}
            onClick={() => setAdet(a)}
            className={cx(
              'rounded-xl px-4 py-2 text-sm font-bold transition',
              adet === a ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 dark:bg-white/5 dark:text-ink-300'
            )}
          >
            {a}
          </button>
        ))}
      </div>

      <label className="card mb-5 flex cursor-pointer items-center gap-3 p-3.5">
        <input
          type="checkbox"
          checked={sadeceCozulmemis}
          onChange={(e) => setSadeceCozulmemis(e.target.checked)}
          className="h-5 w-5 accent-brand-600"
        />
        <div>
          <p className="text-sm font-semibold">Sadece çözmediğim sorular</p>
          <p className="text-[11px] text-ink-400">Daha önce cevapladığın sorular quiz'e gelmez.</p>
        </div>
      </label>

      <button className="btn-primary w-full !py-3.5 text-base" onClick={basla}>
        <IconQuiz size={19} /> QUİZİ BAŞLAT
      </button>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-ink-400">
        <IconTrophy size={14} /> Her doğru cevap 1 puan · {tumu ? 'tüm dersler' : `${secili.length} ders`}
      </p>
    </>
  )
}
