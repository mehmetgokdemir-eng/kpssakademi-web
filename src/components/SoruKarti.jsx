import { useEffect, useMemo, useRef, useState } from 'react'
import { cx, HARFLER, harf, karistir } from '../lib/utils.js'
import { useSettings } from '../lib/settings.jsx'
import { IconBookmark, IconNote, IconSpeaker, IconCheck, IconWrong } from './Icons.jsx'
import SoruBildir from './SoruBildir.jsx'
import { oku } from '../lib/tts.js'
import { Modal } from './UI.jsx'

/**
 * Tek bir soruyu gösterir.
 * mod: 'calisma'  → cevap verilince doğru/yanlış gösterilir, açıklama açılır
 *      'sinav'    → geri bildirim yok, sadece seçim kaydedilir
 */
export default function SoruKarti({
  soru,
  sira,
  toplam,
  mod = 'calisma',
  secili,
  onCevap,
  onSonraki,
  kayitli,
  onKayit,
  not,
  onNot,
  isaretli,
  onIsaret,
}) {
  const { settings } = useSettings()
  const [notAcik, setNotAcik] = useState(false)
  const [notMetin, setNotMetin] = useState(not?.metin || '')
  const kartRef = useRef(null)

  // Kısa gövde kullanma: dönüş değeri React'e temizleme fonksiyonu gibi görünür.
  useEffect(() => {
    setNotMetin(not?.metin || '')
  }, [soru?.id]) // eslint-disable-line

  useEffect(() => {
    kartRef.current?.scrollIntoView({ block: 'nearest' })
  }, [soru?.id])

  // Şık karıştırma (ayarlardan açılır) — doğru cevabın indeksi buna göre kaydırılır
  const { secenekler, dogruIndeks } = useMemo(() => {
    if (!soru) return { secenekler: [], dogruIndeks: 0 }
    if (!settings.siklariKaristir || mod === 'sinav') {
      return { secenekler: soru.secenekler, dogruIndeks: soru.dogru }
    }
    const eslesen = karistir(soru.secenekler.map((s, i) => ({ s, i })))
    return {
      secenekler: eslesen.map((x) => x.s),
      dogruIndeks: eslesen.findIndex((x) => x.i === soru.dogru),
    }
  }, [soru?.id, settings.siklariKaristir, mod]) // eslint-disable-line

  if (!soru) return null

  const cevaplandi = secili != null
  const dogruMu = cevaplandi && secili === dogruIndeks

  return (
    <div ref={kartRef} className="animate-slideUp">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-ink-400">
          {sira != null && (
            <span>
              Soru {sira}
              {toplam ? ` / ${toplam}` : ''}
            </span>
          )}
          {soru.konuAd && <span className="hidden truncate sm:inline">· {soru.konuAd}</span>}
        </div>
        <div className="flex items-center gap-1">
          {settings.tts && (
            <button
              className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-white/10"
              onClick={() => oku(`${soru.soru}. ${secenekler.map((s, i) => `${harf(i)} şıkkı: ${s}`).join('. ')}`, { hiz: settings.ttsHiz })}
              aria-label="Soruyu sesli oku"
            >
              <IconSpeaker size={18} />
            </button>
          )}
          {onNot && (
            <button
              className={cx('rounded-lg p-1.5 hover:bg-ink-100 dark:hover:bg-white/10', not ? 'text-amber-500' : 'text-ink-400')}
              onClick={() => setNotAcik(true)}
              aria-label="Not ekle"
            >
              <IconNote size={18} />
            </button>
          )}
          {onKayit && (
            <button
              className={cx('rounded-lg p-1.5 hover:bg-ink-100 dark:hover:bg-white/10', kayitli ? 'text-brand-600' : 'text-ink-400')}
              onClick={() => onKayit(soru.id)}
              aria-label="Soruyu kaydet"
            >
              <IconBookmark size={18} dolu={kayitli} />
            </button>
          )}
        </div>
      </div>

      <div className="card p-4 sm:p-5">
        <p className="whitespace-pre-line text-[15px] font-medium leading-relaxed sm:text-base">{soru.soru}</p>

        {soru.gorsel && <img src={soru.gorsel} alt="" className="mt-3 max-h-64 w-full rounded-xl object-contain" loading="lazy" />}

        <div className="mt-4 space-y-2">
          {secenekler.map((sec, i) => {
            const bu = secili === i
            const dogruSik = cevaplandi && mod === 'calisma' && i === dogruIndeks
            const yanlisSik = cevaplandi && mod === 'calisma' && bu && i !== dogruIndeks
            return (
              <button
                key={i}
                disabled={cevaplandi && mod === 'calisma'}
                onClick={() => onCevap?.(i, i === dogruIndeks)}
                className={cx(
                  'flex w-full items-start gap-3 rounded-xl border p-3 text-left text-sm transition',
                  'disabled:cursor-default',
                  dogruSik && 'border-emerald-400 bg-emerald-50 dark:border-emerald-500/50 dark:bg-emerald-500/10',
                  yanlisSik && 'border-red-400 bg-red-50 dark:border-red-500/50 dark:bg-red-500/10',
                  !dogruSik && !yanlisSik && bu && 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/10',
                  !dogruSik && !yanlisSik && !bu && 'border-ink-200 hover:border-brand-300 hover:bg-brand-50/40 dark:border-white/10 dark:hover:border-brand-500/40 dark:hover:bg-white/5'
                )}
              >
                <span
                  className={cx(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold',
                    dogruSik
                      ? 'bg-emerald-500 text-white'
                      : yanlisSik
                        ? 'bg-red-500 text-white'
                        : bu
                          ? 'bg-brand-600 text-white'
                          : 'bg-ink-100 text-ink-500 dark:bg-white/10 dark:text-ink-300'
                  )}
                >
                  {dogruSik ? <IconCheck size={15} /> : yanlisSik ? <IconWrong size={15} /> : harf(i)}
                </span>
                <span className="pt-0.5 leading-relaxed">{sec}</span>
              </button>
            )
          })}
        </div>

        {cevaplandi && mod === 'calisma' && (
          <div className="mt-4 animate-pop">
            <div
              className={cx(
                'rounded-xl px-3.5 py-3 text-sm',
                dogruMu
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-300'
              )}
            >
              <p className="font-bold">{dogruMu ? 'Doğru!' : `Yanlış — doğru cevap ${harf(dogruIndeks)}`}</p>
              {settings.aciklamaGoster && soru.aciklama && <p className="mt-1.5 leading-relaxed opacity-90">{soru.aciklama}</p>}
            </div>
            {onSonraki && (
              <button className="btn-primary mt-3 w-full" onClick={onSonraki}>
                Sonraki Soru
              </button>
            )}
          </div>
        )}

        {mod === 'sinav' && onIsaret && (
          <button
            onClick={() => onIsaret(soru.id)}
            className={cx('mt-4 text-xs font-semibold', isaretli ? 'text-amber-500' : 'text-ink-400')}
          >
            {isaretli ? '★ İşaretli — sonra dön' : '☆ Sonra dönmek için işaretle'}
          </button>
        )}

        {/* Sınav sırasında dikkat dağıtmasın diye yalnızca çalışma modunda. */}
        {mod !== 'sinav' && <SoruBildir soru={soru} className="mt-4" />}
      </div>

      <Modal acik={notAcik} kapat={() => setNotAcik(false)} baslik="Not">
        <textarea
          className="input min-h-[140px] resize-y"
          placeholder="Bu soruyla ilgili notun…"
          value={notMetin}
          onChange={(e) => setNotMetin(e.target.value)}
        />
        <div className="mt-3 flex gap-2">
          <button
            className="btn-primary flex-1"
            onClick={() => {
              onNot?.(soru.id, notMetin)
              setNotAcik(false)
            }}
          >
            Kaydet
          </button>
          {not && (
            <button
              className="btn-outline"
              onClick={() => {
                onNot?.(soru.id, '')
                setNotMetin('')
                setNotAcik(false)
              }}
            >
              Sil
            </button>
          )}
        </div>
      </Modal>
    </div>
  )
}
