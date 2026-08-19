import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSettings, sinavTarihiniAl, varsayilanSinavTarihi } from '../lib/settings.jsx'
import { disaAktar, iceAktar, hepsiniSifirla, genelIstatistik } from '../lib/storage.js'
import { useProgress } from '../lib/hooks.js'
import { cx, sayi } from '../lib/utils.js'
import { Baslik } from '../components/Layout.jsx'
import { Modal, Rozet } from '../components/UI.jsx'
import { PARCALAR } from '../components/MusicPlayer.jsx'
import { IconMoon, IconSun, IconRefresh, IconLink } from '../components/Icons.jsx'

function Satir({ baslik, aciklama, children }) {
  return (
    <div className="card flex items-center justify-between gap-4 p-3.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{baslik}</p>
        {aciklama && <p className="mt-0.5 text-[11px] text-ink-400">{aciklama}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Anahtar({ acik, degis }) {
  return (
    <button
      onClick={() => degis(!acik)}
      role="switch"
      aria-checked={acik}
      className={cx('relative h-7 w-12 rounded-full transition', acik ? 'bg-brand-600' : 'bg-ink-200 dark:bg-white/15')}
    >
      <span className={cx('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all', acik ? 'left-6' : 'left-1')} />
    </button>
  )
}

export default function Ayarlar() {
  const { settings, set, theme, setTheme } = useSettings()
  const p = useProgress()
  const ist = genelIstatistik()
  const dosyaRef = useRef(null)
  const [sifirlaAcik, setSifirlaAcik] = useState(false)
  const [mesaj, setMesaj] = useState('')

  const sinav = sinavTarihiniAl(settings)
  const yerelISO = (d) => {
    const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    return t.toISOString().slice(0, 16)
  }

  function yedekAl() {
    const blob = new Blob([disaAktar()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `kpss-akademi-yedek-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function yedekYukle(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => {
      try {
        iceAktar(String(r.result))
        setMesaj('Yedek geri yüklendi.')
      } catch (err) {
        setMesaj('Yedek okunamadı: ' + err.message)
      }
      setTimeout(() => setMesaj(''), 4000)
    }
    r.readAsText(f)
    e.target.value = ''
  }

  return (
    <>
      <Baslik baslik="Ayarlar" geri={false} />

      <h2 className="section-title mb-2">Profil</h2>
      <div className="mb-5 space-y-2.5">
        <Satir baslik="Adın" aciklama="Ana sayfada karşılama için kullanılır">
          <input className="input !w-36 !py-1.5 !text-sm" value={settings.ad} onChange={(e) => set({ ad: e.target.value })} placeholder="Adın" />
        </Satir>
        <Satir baslik="Sınav tarihi" aciklama={`Geri sayım · varsayılan ${varsayilanSinavTarihi().toLocaleDateString('tr-TR')}`}>
          <input
            type="datetime-local"
            className="input !w-52 !py-1.5 !text-sm"
            value={yerelISO(sinav)}
            onChange={(e) => set({ sinavTarihi: e.target.value })}
          />
        </Satir>
        <Satir baslik="Günlük hedef" aciklama="Gün içinde çözmeyi hedeflediğin soru sayısı">
          <input
            type="number"
            min="5"
            max="500"
            className="input !w-24 !py-1.5 !text-sm"
            value={settings.gunlukHedef}
            onChange={(e) => set({ gunlukHedef: Math.max(1, Number(e.target.value) || 0) })}
          />
        </Satir>
        <Satir baslik="Haftalık hedef" aciklama="İstatistik sayfasındaki haftalık halka">
          <input
            type="number"
            min="10"
            max="3000"
            className="input !w-24 !py-1.5 !text-sm"
            value={settings.haftalikHedef}
            onChange={(e) => set({ haftalikHedef: Math.max(1, Number(e.target.value) || 0) })}
          />
        </Satir>
      </div>

      <h2 className="section-title mb-2">Görünüm</h2>
      <div className="mb-5 space-y-2.5">
        <Satir baslik="Tema" aciklama="Gece / gündüz modu">
          <div className="flex gap-1 rounded-xl bg-ink-100 p-1 dark:bg-white/5">
            {[
              { id: 'light', Ikon: IconSun, ad: 'Açık' },
              { id: 'dark', Ikon: IconMoon, ad: 'Koyu' },
            ].map(({ id, Ikon, ad }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={cx(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
                  theme === id ? 'bg-white text-brand-700 shadow-sm dark:bg-ink-800 dark:text-brand-300' : 'text-ink-500'
                )}
              >
                <Ikon size={15} /> {ad}
              </button>
            ))}
          </div>
        </Satir>
      </div>

      <h2 className="section-title mb-2">Soru çözme</h2>
      <div className="mb-5 space-y-2.5">
        <Satir baslik="Açıklamaları göster" aciklama="Cevap sonrası çözüm açıklaması">
          <Anahtar acik={settings.aciklamaGoster} degis={(v) => set({ aciklamaGoster: v })} />
        </Satir>
        <Satir baslik="Şıkları karıştır" aciklama="Ezberi kırmak için şık sırasını değiştirir">
          <Anahtar acik={settings.siklariKaristir} degis={(v) => set({ siklariKaristir: v })} />
        </Satir>
        <Satir baslik="Otomatik sonraki soru" aciklama="Cevaptan kısa süre sonra otomatik geçer">
          <Anahtar acik={settings.otomatikSonraki} degis={(v) => set({ otomatikSonraki: v })} />
        </Satir>
      </div>

      <h2 className="section-title mb-2">Ses</h2>
      <div className="mb-5 space-y-2.5">
        <Satir baslik="Sesli okuma (TTS)" aciklama="Soru ve kartları sesli dinle">
          <Anahtar acik={settings.tts} degis={(v) => set({ tts: v })} />
        </Satir>
        {settings.tts && (
          <Satir baslik="Okuma hızı" aciklama={`${settings.ttsHiz}x`}>
            <input
              type="range"
              min="0.6"
              max="1.6"
              step="0.1"
              value={settings.ttsHiz}
              onChange={(e) => set({ ttsHiz: Number(e.target.value) })}
              className="w-32 accent-brand-600"
            />
          </Satir>
        )}
        <Satir baslik="Arka plan müziği" aciklama="Çalışırken dingin müzik">
          <Anahtar acik={settings.muzikAcik} degis={(v) => set({ muzikAcik: v })} />
        </Satir>
        {settings.muzikAcik && (
          <>
            <Satir baslik="Parça">
              <select className="input !w-48 !py-1.5 !text-xs" value={settings.muzikParca} onChange={(e) => set({ muzikParca: e.target.value })}>
                {PARCALAR.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.ad}
                  </option>
                ))}
              </select>
            </Satir>
            <Satir baslik="Ses seviyesi">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.muzikSes}
                onChange={(e) => set({ muzikSes: Number(e.target.value) })}
                className="w-32 accent-brand-600"
              />
            </Satir>
          </>
        )}
      </div>

      <h2 className="section-title mb-2">Verilerim</h2>
      <div className="mb-5 space-y-2.5">
        <div className="card p-3.5">
          <div className="flex flex-wrap gap-1.5">
            <Rozet renk="gri">{sayi(ist.toplam)} çözülen soru</Rozet>
            <Rozet renk="gri">{sayi(Object.keys(p.kayitlilar).length)} kayıtlı</Rozet>
            <Rozet renk="gri">{sayi(Object.keys(p.notlar).length)} not</Rozet>
            <Rozet renk="gri">{sayi(p.denemeler?.length || 0)} deneme</Rozet>
          </div>
          <p className="mt-2 text-[11px] text-ink-400">
            Tüm ilerlemen yalnızca bu tarayıcıda saklanır — sunucuya gönderilmez. Cihaz değiştireceksen yedek al.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-ghost !text-xs" onClick={yedekAl}>
              Yedek indir
            </button>
            <button className="btn-ghost !text-xs" onClick={() => dosyaRef.current?.click()}>
              Yedeği geri yükle
            </button>
            <input ref={dosyaRef} type="file" accept="application/json" className="hidden" onChange={yedekYukle} />
            <button className="btn !text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" onClick={() => setSifirlaAcik(true)}>
              <IconRefresh size={15} /> Tümünü sıfırla
            </button>
          </div>
          {mesaj && <p className="mt-2 text-xs font-semibold text-emerald-600">{mesaj}</p>}
        </div>
      </div>

      <h2 className="section-title mb-2">Uygulama</h2>
      <div className="space-y-2.5 pb-4">
        <Link to="/hakkinda" className="card flex items-center justify-between p-3.5 text-sm font-semibold">
          Hakkında <IconLink size={16} className="text-ink-400" />
        </Link>
        <Link to="/gizlilik" className="card flex items-center justify-between p-3.5 text-sm font-semibold">
          Gizlilik Politikası <IconLink size={16} className="text-ink-400" />
        </Link>
        <Link to="/iletisim" className="card flex items-center justify-between p-3.5 text-sm font-semibold">
          İletişim <IconLink size={16} className="text-ink-400" />
        </Link>
        <a
          href="https://play.google.com/store/apps/details?id=com.nihangokdemir.kpss"
          target="_blank"
          rel="noreferrer"
          className="card flex items-center justify-between p-3.5 text-sm font-semibold"
        >
          Android uygulamasını indir <IconLink size={16} className="text-ink-400" />
        </a>
        <p className="pt-2 text-center text-[11px] text-ink-400">KPSS Akademi Web · sürüm {__APP_VERSION__}</p>
      </div>

      <Modal acik={sifirlaAcik} kapat={() => setSifirlaAcik(false)} baslik="Tüm verileri sıfırla">
        <p className="text-sm text-ink-500">
          Çözüm geçmişin, yanlışların, kayıtlıların, notların, deneme sonuçların ve oyun skorların silinecek. Bu işlem geri alınamaz.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            className="btn-primary flex-1 !bg-red-600 hover:!bg-red-700"
            onClick={() => {
              hepsiniSifirla()
              setSifirlaAcik(false)
            }}
          >
            Evet, sıfırla
          </button>
          <button className="btn-outline" onClick={() => setSifirlaAcik(false)}>
            Vazgeç
          </button>
        </div>
      </Modal>
    </>
  )
}
