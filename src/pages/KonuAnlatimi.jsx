import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getDers, getNot, getNotlar, getKonularByDers } from '../lib/data.js'
import { useAsync } from '../lib/hooks.js'
import { cx } from '../lib/utils.js'
import { Yukleniyor, Hata, Bos } from '../components/UI.jsx'
import { Baslik } from '../components/Layout.jsx'
import { IconChevron, IconBook, IconQuiz, IconSpeaker } from '../components/Icons.jsx'
import { oku, durdur } from '../lib/tts.js'
import { useSettings } from '../lib/settings.jsx'

/* ── Ders içindeki konu anlatımı listesi ───────────────────── */
export function AnlatimListesi() {
  const { dersId } = useParams()
  const { veri, yukleniyor, hata, yenile } = useAsync(async () => {
    const [ders, notlar] = await Promise.all([getDers(dersId), getNotlar(dersId)])
    return { ders, notlar }
  }, [dersId])

  if (yukleniyor) return <Yukleniyor satir={5} />
  if (hata) return <Hata hata={hata} yenile={yenile} />
  if (!veri?.notlar?.length)
    return (
      <>
        <Baslik baslik="Konu Anlatımı" altBaslik={veri?.ders?.ad} />
        <Bos baslik="Bu derste konu anlatımı yok" ikon={<IconBook size={34} />} />
      </>
    )

  return (
    <>
      <Baslik baslik="Konu Anlatımı" altBaslik={`${veri.ders?.ad} · ${veri.notlar.length} konu`} />
      <div className="space-y-2.5">
        {veri.notlar.map((n) => (
          <Link
            key={n.konuId}
            to={`/ders/${dersId}/anlatim/${n.konuId}`}
            className="card flex items-start gap-3.5 p-4 transition active:scale-[.99]"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
              <IconBook size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold leading-tight">{n.baslik}</p>
              {n.ozet && <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">{n.ozet}</p>}
              <p className="mt-1.5 text-[11px] text-ink-400">{n.bolumler?.length || 0} bölüm</p>
            </div>
            <IconChevron size={18} className="mt-1 shrink-0 text-ink-300" />
          </Link>
        ))}
      </div>
    </>
  )
}

/* ── Tek konu anlatımı ─────────────────────────────────────── */
export default function KonuAnlatimi() {
  const { dersId, konuId } = useParams()
  const { settings } = useSettings()
  const [acik, setAcik] = useState(0) // ilk bölüm açık

  const { veri, yukleniyor, hata, yenile } = useAsync(async () => {
    const [ders, not, konular] = await Promise.all([getDers(dersId), getNot(dersId, konuId), getKonularByDers(dersId)])
    return { ders, not, konu: konular.find((k) => k.id === konuId) }
  }, [dersId, konuId])

  const tumMetin = useMemo(
    () => (veri?.not ? [veri.not.ozet, ...(veri.not.bolumler || []).map((b) => `${b.baslik}. ${b.icerik}`)].join('. ') : ''),
    [veri]
  )

  if (yukleniyor) return <Yukleniyor satir={5} />
  if (hata) return <Hata hata={hata} yenile={yenile} />
  if (!veri?.not)
    return (
      <>
        <Baslik baslik="Konu Anlatımı" />
        <Bos baslik="Bu konunun anlatımı bulunamadı" ikon={<IconBook size={34} />} />
      </>
    )

  const { not } = veri

  return (
    <>
      <Baslik
        baslik={not.baslik}
        altBaslik={veri.ders?.ad}
        sag={
          settings.tts ? (
            <button
              onClick={() => oku(tumMetin, { hiz: settings.ttsHiz })}
              className="rounded-xl p-2 text-ink-400 hover:bg-ink-100 dark:hover:bg-white/10"
              aria-label="Sesli oku"
            >
              <IconSpeaker size={19} />
            </button>
          ) : null
        }
      />

      {not.ozet && (
        <div className="card mb-4 border-l-4 !border-l-brand-500 p-4">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-400">Özet</p>
          <p className="mt-1.5 text-sm leading-relaxed">{not.ozet}</p>
        </div>
      )}

      <div className="space-y-2.5">
        {(not.bolumler || []).map((b, i) => {
          const acikMi = acik === i
          return (
            <div key={i} className="card overflow-hidden">
              <button
                onClick={() => setAcik(acikMi ? -1 : i)}
                className="flex w-full items-center gap-3 p-4 text-left"
                aria-expanded={acikMi}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ink-100 text-xs font-extrabold text-ink-500 dark:bg-white/10 dark:text-ink-300">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-bold leading-snug">{b.baslik}</span>
                <IconChevron size={17} className={cx('shrink-0 text-ink-300 transition-transform', acikMi && 'rotate-90')} />
              </button>
              {acikMi && (
                <div className="border-t border-ink-100 px-4 py-3.5 dark:border-white/5">
                  <p className="whitespace-pre-line text-[14px] leading-[1.75] text-ink-700 dark:text-ink-200">{b.icerik}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <Link className="btn-primary" to={`/ders/${dersId}/konu/${konuId}`} onClick={durdur}>
          <IconQuiz size={17} /> Bu Konuyu Çöz
        </Link>
        <Link className="btn-ghost" to={`/ders/${dersId}/anlatim`} onClick={durdur}>
          Diğer Konular
        </Link>
      </div>
    </>
  )
}
