import { Link } from 'react-router-dom'
import { useProgress } from '../lib/hooks.js'
import { cx } from '../lib/utils.js'
import { Baslik, TemaButonu } from '../components/Layout.jsx'
import { IconMap, IconClock, IconGame, IconCheck, IconFlame, IconChevron, IconTrophy } from '../components/Icons.jsx'

export const OYUNLAR = [
  {
    id: 'harita',
    ad: 'Harita Avcısı',
    aciklama: 'Türkiye haritasında dağ, göl, ova ve platoları bul',
    Ikon: IconMap,
    renk: 'from-emerald-500 to-emerald-800',
    etiket: 'Coğrafya',
  },
  {
    id: 'kronoloji',
    ad: 'Kronoloji',
    aciklama: 'Olayları doğru tarih sırasına diz',
    Ikon: IconClock,
    renk: 'from-amber-500 to-orange-700',
    etiket: 'Tarih',
  },
  {
    id: 'eslestirme',
    ad: 'Eşleştirme',
    aciklama: 'Kavram ve tanımları eşleştir',
    Ikon: IconGame,
    renk: 'from-sky-500 to-blue-800',
    etiket: 'Karışık',
  },
  {
    id: 'dogrumu',
    ad: 'Doğru mu?',
    aciklama: 'Verilen bilgi doğru mu yanlış mı, hızlıca karar ver',
    Ikon: IconCheck,
    renk: 'from-violet-500 to-purple-800',
    etiket: 'Karışık',
  },
  {
    id: 'maraton',
    ad: 'Maraton',
    aciklama: '3 canla ne kadar ilerleyebilirsin?',
    Ikon: IconFlame,
    renk: 'from-rose-500 to-red-800',
    etiket: 'Karışık',
  },
]

export default function Oyunlar() {
  const p = useProgress()
  return (
    <>
      <Baslik baslik="Oyunlar" altBaslik="Oynayarak öğren" geri={false} sag={<TemaButonu />} />
      <div className="space-y-3">
        {OYUNLAR.map(({ id, ad, aciklama, Ikon, renk, etiket }) => {
          const s = p.oyun[id]
          return (
            <Link key={id} to={`/oyun/${id}`} className="block active:scale-[.99]">
              <div className={cx('flex items-center gap-4 rounded-2xl bg-gradient-to-br p-4 text-white shadow-card', renk)}>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20">
                  <Ikon size={24} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold">{ad}</p>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">{etiket}</span>
                  </div>
                  <p className="mt-0.5 text-xs opacity-85">{aciklama}</p>
                  {s && (
                    <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold opacity-90">
                      <IconTrophy size={12} /> En iyi {s.enIyi} · {s.oynanan} kez oynandı
                    </p>
                  )}
                </div>
                <IconChevron size={20} className="opacity-70" />
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}
