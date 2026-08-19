import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSorularByIdler } from '../lib/data.js'
import { useAsync, useProgress, useSureOlcer } from '../lib/hooks.js'
import { cevapKaydet, kayitToggle, notKaydet, tekrarBekleyenler, tekrarOzet } from '../lib/storage.js'
import { useSettings } from '../lib/settings.jsx'
import { karistir, sayi } from '../lib/utils.js'
import { Bos, Hata, Ilerleme, Yukleniyor } from '../components/UI.jsx'
import { Baslik } from '../components/Layout.jsx'
import SoruKarti from '../components/SoruKarti.jsx'
import { IconRefresh, IconCheck } from '../components/Icons.jsx'

/* Bugünün Tekrarı — Android'deki TekrarActivity'nin karşılığı.
 *
 * Aralıklı tekrar: her çözülen soru storage.js'te bir kutuya yerleşir
 * (yanlış → 1 gün sonra, doğru → 3, 7, 16, 35, 90 gün). Burada yalnızca
 * zamanı GELMİŞ olanlar gösterilir. Amaç yeni soru çözmek değil, unutmadan
 * hemen önce hatırlatmak. */

export default function Tekrar() {
  const { settings } = useSettings()
  const p = useProgress()
  const { sifirla, gecen } = useSureOlcer()
  const [i, setI] = useState(0)
  const [cevaplar, setCevaplar] = useState({})
  const [bitti, setBitti] = useState(false)
  const ozet = tekrarOzet()

  const { veri, yukleniyor, hata, yenile } = useAsync(async () => {
    const bekleyen = tekrarBekleyenler(30)
    if (!bekleyen.length) return { sorular: [] }
    const sorular = await getSorularByIdler(bekleyen.map((b) => ({ id: b.id, dersId: b.dersId })))
    return { sorular: karistir(sorular) }
  }, [])

  const sorular = veri?.sorular || []
  const soru = sorular[i]
  const dogruSayisi = useMemo(() => Object.values(cevaplar).filter((c) => c.dogru).length, [cevaplar])

  if (yukleniyor) return <Yukleniyor satir={4} />
  if (hata) return <Hata hata={hata} yenile={yenile} />

  if (!sorular.length)
    return (
      <>
        <Baslik baslik="Bugünün Tekrarı" altBaslik="Aralıklı tekrar" />
        <Bos
          baslik="Bugün tekrar edilecek soru yok"
          aciklama={
            ozet.toplam
              ? `Kuyrukta ${sayi(ozet.toplam)} soru var; en yakını ${ozet.yarin ? 'yarın' : 'ilerleyen günlerde'} gelecek. Soru çözdükçe kuyruk dolar.`
              : 'Soru çözmeye başladığında çözdüğün sorular otomatik olarak tekrar kuyruğuna girer.'
          }
        />
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Link className="btn-primary" to="/dersler">
            Soru Çöz
          </Link>
          <Link className="btn-ghost" to="/yanlislarim">
            Yanlışlarım
          </Link>
        </div>
      </>
    )

  if (bitti) {
    const oran = Math.round((dogruSayisi / sorular.length) * 100)
    return (
      <>
        <Baslik baslik="Tekrar Bitti" geri={false} />
        <div className="card p-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15">
            <IconCheck size={30} />
          </div>
          <p className="mt-3 text-2xl font-extrabold">
            {dogruSayisi}/{sorular.length}
          </p>
          <p className="text-sm text-ink-500">%{oran} doğru</p>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
            Doğru bildiklerin daha uzun süre sonra, yanlış bildiklerin yarın tekrar karşına çıkacak.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button className="btn-outline" onClick={() => window.location.reload()}>
              <IconRefresh size={16} /> Yeniden
            </button>
            <Link className="btn-primary" to="/">
              Ana Sayfa
            </Link>
          </div>
        </div>
      </>
    )
  }

  const cevapla = (secim) => {
    if (cevaplar[soru.id]) return
    const dogru = secim === soru.dogru
    setCevaplar((c) => ({ ...c, [soru.id]: { secim, dogru } }))
    cevapKaydet({ soruId: soru.id, dersId: soru.dersId, konuId: soru.konuId, dogruMu: dogru, sureSn: gecen() })
  }

  const sonraki = () => {
    if (i + 1 >= sorular.length) setBitti(true)
    else {
      setI(i + 1)
      sifirla()
    }
  }

  return (
    <>
      <Baslik baslik="Bugünün Tekrarı" altBaslik={`${sayi(sorular.length)} soru · unutmadan hatırla`} />
      <div className="mb-3 flex items-center gap-3">
        <Ilerleme deger={i + 1} toplam={sorular.length} ince />
        <span className="shrink-0 text-xs font-semibold tabular-nums text-ink-400">
          {i + 1}/{sorular.length}
        </span>
      </div>
      <SoruKarti
        soru={soru}
        sira={i + 1}
        toplam={sorular.length}
        secili={cevaplar[soru.id]?.secim}
        onCevap={cevapla}
        onSonraki={sonraki}
        kayitli={!!p.kayitlilar[soru.id]}
        onKayit={() => kayitToggle(soru.id, soru.dersId)}
        not={p.notlar[soru.id]?.metin}
        onNot={(m) => notKaydet(soru.id, m, soru.dersId)}
        aciklamaGoster={settings.aciklamaGoster}
      />
    </>
  )
}
