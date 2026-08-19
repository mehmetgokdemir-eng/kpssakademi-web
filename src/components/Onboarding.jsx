import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ls, cx } from '../lib/utils.js'
import { useSettings, SINAV_TURLERI } from '../lib/settings.jsx'
import { IconBook, IconCards, IconGame, IconTarget, IconExam } from './Icons.jsx'

/* İlk açılış tanıtımı — Android'deki OnboardingActivity'nin karşılığı.
 *
 * Üç adım: ne var → hangi sınava hazırlanıyorsun → adın. Hepsi atlanabilir.
 * Bir kez gösterilir; kapatıldığında kalıcı olarak işaretlenir. */

const GORULDU = 'ka:onboarding-goruldu'

const ADIMLAR = [
  {
    baslik: 'KPSS Akademi’ye hoş geldin',
    metin: 'Soru bankası, bilgi kartları, konu anlatımları, deneme sınavları ve oyunlar — hepsi ücretsiz, üyeliksiz ve çevrimdışı çalışıyor.',
    maddeler: [
      [IconBook, '16.066 soru', 'Hepsi çözüm açıklamalı'],
      [IconCards, '981 bilgi kartı', 'Çevir-öğren, sesli okumalı'],
      [IconExam, '64 deneme sınavı', 'Gerçek süre ve soru dağılımı'],
      [IconGame, '5 oyun', 'Harita, kronoloji, eşleştirme'],
    ],
  },
  { baslik: 'Hangi sınava hazırlanıyorsun?', metin: 'Ana sayfadaki geri sayım ve hedef planı buna göre ayarlanır. Sonradan Ayarlar’dan değiştirebilirsin.' },
  { baslik: 'Sana nasıl seslenelim?', metin: 'Yalnızca ana sayfadaki karşılamada kullanılır, hiçbir yere gönderilmez.' },
]

export default function Onboarding() {
  const nav = useNavigate()
  const { settings, set } = useSettings()
  const [gorunur, setGorunur] = useState(() => !ls.get(GORULDU, false))
  const [adim, setAdim] = useState(0)
  const [ad, setAd] = useState(settings.ad || '')

  if (!gorunur) return null

  const kapat = () => {
    ls.set(GORULDU, true)
    setGorunur(false)
  }
  const bitir = () => {
    if (ad.trim()) set({ ad: ad.trim() })
    kapat()
  }

  const a = ADIMLAR[adim]

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm" />
      <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl animate-slideUp dark:bg-ink-900 sm:max-w-md sm:rounded-3xl">
        <div className="mb-4 flex items-center gap-1.5">
          {ADIMLAR.map((_, i) => (
            <span
              key={i}
              className={cx('h-1.5 flex-1 rounded-full transition', i <= adim ? 'bg-brand-600' : 'bg-ink-200 dark:bg-white/10')}
            />
          ))}
        </div>

        <h2 className="text-xl font-extrabold leading-tight">{a.baslik}</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500 dark:text-ink-400">{a.metin}</p>

        {adim === 0 && (
          <div className="mt-4 space-y-2.5">
            {a.maddeler.map(([Ikon, ad2, alt]) => (
              <div key={ad2} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                  <Ikon size={18} />
                </span>
                <div>
                  <p className="text-sm font-bold leading-tight">{ad2}</p>
                  <p className="text-[12px] text-ink-400">{alt}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {adim === 1 && (
          <div className="mt-4 space-y-2">
            {Object.entries(SINAV_TURLERI).map(([id, t]) => {
              const secili = (settings.sinavTuru || 'lisans') === id
              return (
                <button
                  key={id}
                  onClick={() => set({ sinavTuru: id, sinavTarihi: '' })}
                  className={cx(
                    'flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition',
                    secili
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
                      : 'border-ink-200 hover:border-brand-300 dark:border-white/10'
                  )}
                >
                  <span className="text-sm font-semibold">{t.ad}</span>
                  {secili && <IconTarget size={17} className="shrink-0 text-brand-600" />}
                </button>
              )
            })}
          </div>
        )}

        {adim === 2 && (
          <input
            className="input mt-4"
            placeholder="Adın (isteğe bağlı)"
            value={ad}
            onChange={(e) => setAd(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && bitir()}
            autoFocus
          />
        )}

        <div className="mt-5 flex gap-2.5">
          <button className="btn-ghost flex-1" onClick={kapat}>
            Atla
          </button>
          {adim < ADIMLAR.length - 1 ? (
            <button className="btn-primary flex-1" onClick={() => setAdim(adim + 1)}>
              Devam
            </button>
          ) : (
            <button
              className="btn-primary flex-1"
              onClick={() => {
                bitir()
                nav('/dersler')
              }}
            >
              Başla
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
