#!/usr/bin/env node
/**
 * Oyun ve "Bunu biliyor muydun?" verilerini GERÇEK içerikten üretir.
 *
 * Neden gerekli: bu üç dosya aktarımdan kalma örneklerdi —
 *   dogrumu.json    18 ifade
 *   eslestirme.json 20 eşleşme
 *   bilgiler.json   15 bilgi   (15 gün sonra kendini tekrar ediyordu)
 * Oysa elde 981 gerçek bilgi kartı ve 16.066 açıklamalı soru var.
 *
 * Kaynaklar:
 *   • Eşleştirme  ← bilgi kartları (ön yüz ↔ arka yüz)
 *   • Doğru mu?   ← bilgi kartları; yanlış şıklar AYNI KONUDAN başka bir
 *                    kartın cevabıyla üretilir (yanlışlığı garanti, ama
 *                    inandırıcı — rastgele bir cevap kadar kolay elenmiyor)
 *   • Bilgiler    ← soru açıklamalarının ilk cümleleri (yalnızca kendi
 *                    başına anlamlı, soruya atıf yapmayanlar)
 *
 * Tohum sabit: her derlemede aynı çıktı üretilir.
 * Çalıştırma: npm run oyun:uret
 */

import { readFile, writeFile, readdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..')
const VERI = join(KOK, 'public/data')

function rastgele(tohum) {
  let a = tohum >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const karistir = (dizi, rnd) => {
  const a = [...dizi]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const rnd = rastgele(20260819)

/** Kart arka yüzündeki #etiketleri ayıklar. */
const temiz = (s) =>
  String(s)
    .replace(/#[\p{L}\p{N}_]+/gu, '')
    .replace(/\s+/g, ' ')
    .trim()

const index = JSON.parse(await readFile(join(VERI, 'index.json'), 'utf8'))
const dersAdi = Object.fromEntries(index.dersler.map((d) => [d.id, d.ad]))

/* ── Kartları oku ───────────────────────────────────────────── */
const kartlar = []
for (const dosya of await readdir(join(VERI, 'kartlar'))) {
  const dersId = dosya.replace(/\.json$/, '')
  const liste = JSON.parse(await readFile(join(VERI, 'kartlar', dosya), 'utf8'))
  for (const k of liste) {
    const on = temiz(k.on)
    const arka = temiz(k.arka)
    if (!on || !arka) continue
    kartlar.push({ id: k.id, dersId, konuId: k.konuId || '_', on, arka })
  }
}
console.log(`  kaynak: ${kartlar.length} bilgi kartı`)

/* ── 1) Eşleştirme ──────────────────────────────────────────── */
/* Kısa ve tekil cevaplılar seçilir; uzun metinler eşleştirme tahtasına
   sığmıyor, aynı cevabın iki kez geçmesi de oyunu çözümsüz bırakıyor. */
const gorulenCevap = new Set()
const eslestirme = []
for (const k of karistir(kartlar, rnd)) {
  if (k.on.length > 60 || k.arka.length > 46) continue
  const anahtar = k.arka.toLocaleLowerCase('tr')
  if (gorulenCevap.has(anahtar)) continue
  gorulenCevap.add(anahtar)
  eslestirme.push({ id: 'es' + k.id, dersId: k.dersId, sol: k.on, sag: k.arka })
}
await writeFile(join(VERI, 'oyunlar/eslestirme.json'), JSON.stringify(eslestirme), 'utf8')
console.log(`  ✓ eslestirme.json — ${eslestirme.length} eşleşme (önce 20)`)

/* ── 2) Doğru mu? ───────────────────────────────────────────── */
/* Yarısı doğru, yarısı yanlış. Yanlış olanlarda cevap AYNI KONUDAN başka
   bir kartın cevabıyla değiştirilir — böylece yanlışlık kesin ama şık
   inandırıcı kalır. Aynı metne denk gelirse o kart atlanır. */
const konuya = new Map()
for (const k of kartlar) {
  const a = k.dersId + ':' + k.konuId
  if (!konuya.has(a)) konuya.set(a, [])
  konuya.get(a).push(k)
}
/* Oyun her turda yalnızca ~10 ifade kullanıyor; tüm havuzu indirmek
   gereksiz. 400 ifade bol çeşitlilik sağlıyor, dosya ~70 KB kalıyor. */
const DOGRUMU_UST = 400
const dogrumu = []
let sira = 0
for (const k of karistir(kartlar, rnd)) {
  if (dogrumu.length >= DOGRUMU_UST) break
  if (k.on.length > 90 || k.arka.length > 70) continue
  const dogruOlsun = sira++ % 2 === 0
  if (dogruOlsun) {
    dogrumu.push({
      id: 'dm' + k.id,
      dersId: k.dersId,
      ifade: `${k.on} → ${k.arka}`,
      dogru: true,
      aciklama: 'Eşleşme doğru.',
    })
  } else {
    const komsular = (konuya.get(k.dersId + ':' + k.konuId) || []).filter(
      (x) => x.id !== k.id && x.arka.toLocaleLowerCase('tr') !== k.arka.toLocaleLowerCase('tr') && x.arka.length <= 70
    )
    if (!komsular.length) continue
    const sahte = komsular[Math.floor(rnd() * komsular.length)]
    dogrumu.push({
      id: 'dm' + k.id,
      dersId: k.dersId,
      ifade: `${k.on} → ${sahte.arka}`,
      dogru: false,
      aciklama: `Doğrusu: ${k.arka}`,
    })
  }
}
await writeFile(join(VERI, 'oyunlar/dogrumu.json'), JSON.stringify(dogrumu), 'utf8')
const dogruSayisi = dogrumu.filter((d) => d.dogru).length
console.log(`  ✓ dogrumu.json — ${dogrumu.length} ifade (${dogruSayisi} doğru / ${dogrumu.length - dogruSayisi} yanlış) (önce 18)`)

/* ── 3) Bunu biliyor muydun? ────────────────────────────────── */
/* Soru açıklamalarının ilk cümlesi alınır. Soruya atıf yapan, hesap
   adımı anlatan veya şıklardan söz eden açıklamalar elenir; tek başına
   okunduğunda anlamlı olmayan bir "bilgi" işe yaramaz. */
const ELE = /seçenek|şıkk?|soruda|soruyu|yukarıdaki|verilen|bu nedenle|dolayısıyla|görüldüğü gibi|hesaplan|formül|=|\d\s*\/\s*\d/i
const bilgiler = []
const gorulenMetin = new Set()
for (const dosya of await readdir(join(VERI, 'sorular'))) {
  const dersId = dosya.replace(/\.json$/, '')
  const liste = JSON.parse(await readFile(join(VERI, 'sorular', dosya), 'utf8'))
  const secilen = []
  for (const s of karistir(liste, rnd)) {
    const a = String(s.aciklama || '').trim()
    if (!a) continue
    const cumle = a.split(/(?<=[.!?])\s+/)[0]?.trim()
    if (!cumle || cumle.length < 60 || cumle.length > 180) continue
    if (ELE.test(cumle)) continue
    if (!/[.!?]$/.test(cumle)) continue
    const anahtar = cumle.toLocaleLowerCase('tr').slice(0, 50)
    if (gorulenMetin.has(anahtar)) continue
    gorulenMetin.add(anahtar)
    secilen.push({ id: 'b' + s.id, metin: cumle, ders: dersAdi[dersId] || dersId })
    /* Ders başına üst sınır. bilgiler.json ANA SAYFADA yükleniyor ve
       ekranda günde tek bir bilgi gösteriliyor; 840 kayıt 145 KB ediyordu.
       18 × 14 ders ≈ 250 bilgi, ~45 KB — yıla yakın çeşitlilik, ucuz dosya. */
    if (secilen.length >= 18) break
  }
  bilgiler.push(...secilen)
}
await writeFile(join(VERI, 'bilgiler.json'), JSON.stringify(karistir(bilgiler, rnd)), 'utf8')
console.log(`  ✓ bilgiler.json — ${bilgiler.length} bilgi (önce 15)`)

console.log('\n  ── örnekler ──')
for (const x of eslestirme.slice(0, 3)) console.log(`  eşleştirme: ${x.sol}  ↔  ${x.sag}`)
for (const x of dogrumu.slice(0, 3)) console.log(`  doğru mu (${x.dogru ? 'D' : 'Y'}): ${x.ifade}  [${x.aciklama}]`)
for (const x of bilgiler.slice(0, 3)) console.log(`  bilgi (${x.ders}): ${x.metin}`)
