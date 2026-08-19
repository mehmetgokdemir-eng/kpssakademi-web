import { useState } from 'react'
import { Modal } from './UI.jsx'
import { cx } from '../lib/utils.js'
import { IconWrong, IconNote } from './Icons.jsx'

/* Soru Bildir — Android'deki SoruBildir'in karşılığı.
 *
 * Sunucumuz olmadığı için bildirim e-posta ile gidiyor: kullanıcı sebebi
 * seçiyor, gövde soru kimliği/ders/konu ile birlikte hazır geliyor. Android
 * sürümü de aynı yöntemi kullanıyor (ACTION_SENDTO). */

const EPOSTA = 'mehmetgokdemir@gmail.com'

const SEBEPLER = [
  'Cevap anahtarı yanlış',
  'Soruda yazım/anlatım hatası',
  'Şıklarda hata var',
  'Açıklama yanlış veya eksik',
  'Soru güncelliğini yitirmiş',
  'Diğer',
]

export default function SoruBildir({ soru, className }) {
  const [acik, setAcik] = useState(false)
  const [sebep, setSebep] = useState('')
  const [not, setNot] = useState('')

  if (!soru) return null

  const gonder = () => {
    const konu = `KPSS Akademi — Hatalı soru bildirimi (#${soru.id})`
    const govde = [
      'Aşağıdaki soruda hata olduğunu düşünüyorum:',
      '',
      `Soru No : ${soru.id}`,
      `Ders    : ${soru.dersId || '-'}`,
      `Konu    : ${soru.konuId || '-'}`,
      `Sebep   : ${sebep || 'Belirtilmedi'}`,
      '',
      'Açıklamam:',
      not || '(yazılmadı)',
      '',
      '— Soru metni —',
      soru.soru,
      '',
      ...(soru.secenekler || []).map((s, i) => `${String.fromCharCode(65 + i)}) ${s}`),
      '',
      `Uygulamadaki doğru cevap: ${String.fromCharCode(65 + (soru.dogru ?? 0))}`,
    ].join('\n')
    window.location.href = `mailto:${EPOSTA}?subject=${encodeURIComponent(konu)}&body=${encodeURIComponent(govde)}`
    setAcik(false)
    setSebep('')
    setNot('')
  }

  return (
    <>
      <button
        onClick={() => setAcik(true)}
        className={cx('inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink-400 hover:text-red-500', className)}
      >
        <IconWrong size={13} /> Soruyu bildir
      </button>

      <Modal acik={acik} kapat={() => setAcik(false)} baslik="Hatalı soru bildirimi">
        <p className="text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
          Bildirimin e-posta olarak açılacak; göndermeden önce üzerinde değişiklik yapabilirsin. Soru
          numarası ve metni otomatik ekleniyor.
        </p>

        <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-ink-400">Sebep</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {SEBEPLER.map((s) => (
            <button
              key={s}
              onClick={() => setSebep(s)}
              className={cx(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                sebep === s ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600 dark:bg-white/5 dark:text-ink-300'
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-ink-400">Açıklama (isteğe bağlı)</p>
        <textarea
          className="input mt-1.5 min-h-[80px] resize-y"
          placeholder="Neyin yanlış olduğunu kısaca yaz…"
          value={not}
          onChange={(e) => setNot(e.target.value)}
        />

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <button className="btn-ghost" onClick={() => setAcik(false)}>
            Vazgeç
          </button>
          <button className="btn-primary" onClick={gonder} disabled={!sebep}>
            <IconNote size={16} /> E-posta Aç
          </button>
        </div>
      </Modal>
    </>
  )
}
