import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getDersler, getHavuz } from '../lib/data.js'
import { useAsync, useProgress, useSureOlcer } from '../lib/hooks.js'
import { cevapKaydet, quizPuanEkle, kayitToggle, getState } from '../lib/storage.js'
import { karistir, yuzde, cx } from '../lib/utils.js'
import { Yukleniyor, Hata, Bos, Ilerleme, Istatistik } from '../components/UI.jsx'
import SoruKarti from '../components/SoruKarti.jsx'
import { IconClose, IconTrophy, IconRefresh } from '../components/Icons.jsx'
import Reklam from '../components/Reklam.jsx'

export default function QuizOyna() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const p = useProgress()
  const { sifirla, gecen } = useSureOlcer()

  const dersIdler = (sp.get('dersler') || '').split(',').filter(Boolean)
  const adet = Number(sp.get('adet') || 10)
  const sadeceYeni = sp.get('yeni') === '1'

  const [i, setI] = useState(0)
  const [cevaplar, setCevaplar] = useState({})
  const [bitti, setBitti] = useState(false)
  const puanVerildi = useRef(false)

  const { veri, yukleniyor, hata, yenile } = useAsync(async () => {
    const [dersler, sorular] = await Promise.all([getDersler(), getHavuz(dersIdler, adet)])
    const adlar = Object.fromEntries(dersler.map((d) => [d.id, d.ad]))
    const s = getState()
    let havuz = sorular
    if (sadeceYeni) {
      const yeni = havuz.filter((x) => !s.cozulen[x.id])
      if (yeni.length >= Math.min(adet, 5)) havuz = yeni
    }
    return { sorular: karistir(havuz).slice(0, adet), adlar }
  }, [sp.toString()])

  useEffect(() => sifirla(), [i, sifirla])

  const sorular = veri?.sorular || []
  const soru = sorular[i]
  const dogruSayisi = Object.values(cevaplar).filter((c) => c.dogru).length

  useEffect(() => {
    if (bitti && !puanVerildi.current) {
      puanVerildi.current = true
      quizPuanEkle(dogruSayisi)
    }
  }, [bitti, dogruSayisi])

  if (yukleniyor) return <Yukleniyor satir={5} />
  if (hata) return <Hata hata={hata} yenile={yenile} />
  if (!sorular.length) return <Bos baslik="Soru bulunamadı" aciklama="Seçtiğin derslerde uygun soru yok." />

  const cevapla = (secim, dogruMu) => {
    if (cevaplar[soru.id]) return
    setCevaplar((c) => ({ ...c, [soru.id]: { secim, dogru: dogruMu } }))
    cevapKaydet({ soruId: soru.id, dersId: soru.dersId, konuId: soru.konuId, dogruMu, sureSn: gecen() })
  }

  const sonraki = () => (i + 1 >= sorular.length ? setBitti(true) : setI((x) => x + 1))

  if (bitti) {
    const oran = yuzde(dogruSayisi, sorular.length)
    return (
      <div className="mx-auto max-w-md pt-6">
        <div className="card p-6 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/15">
            <IconTrophy size={32} />
          </span>
          <p className="mt-4 text-sm font-semibold text-ink-400">Quiz tamamlandı</p>
          <p className="mt-1 text-5xl font-extrabold text-violet-600">+{dogruSayisi}</p>
          <p className="mt-1 text-sm text-ink-500">
            {sorular.length} soruda {dogruSayisi} doğru · %{oran}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <Istatistik etiket="Doğru" deger={dogruSayisi} renk="text-emerald-600" />
          <Istatistik etiket="Yanlış" deger={sorular.length - dogruSayisi} renk="text-red-500" />
          <Istatistik etiket="Toplam Puan" deger={p.quiz.puan} renk="text-violet-600" />
        </div>
        <Reklam yer="sonuc" />
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button className="btn-primary" onClick={() => nav(0)}>
            <IconRefresh size={17} /> Yeni Quiz
          </button>
          <button className="btn-ghost" onClick={() => nav('/quiz')}>
            Ayarlara Dön
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => nav('/quiz')} className="rounded-xl p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-white/10" aria-label="Çık">
          <IconClose size={22} />
        </button>
        <div className="flex-1">
          <Ilerleme deger={i + 1} toplam={sorular.length} ince renk="bg-violet-600" />
        </div>
        <span className="text-xs font-bold tabular-nums text-ink-400">
          {i + 1}/{sorular.length}
        </span>
        <span className={cx('chip bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300')}>{dogruSayisi} puan</span>
      </div>

      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-400">{veri.adlar[soru.dersId] || ''}</p>

      <SoruKarti
        soru={soru}
        sira={i + 1}
        toplam={sorular.length}
        secili={cevaplar[soru.id]?.secim ?? null}
        onCevap={cevapla}
        onSonraki={sonraki}
        kayitli={!!p.kayitlilar[soru.id]}
        onKayit={kayitToggle}
      />
    </div>
  )
}
