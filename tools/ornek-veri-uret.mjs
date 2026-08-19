#!/usr/bin/env node
/* Örnek veriyi public/data altına üretir.
   Kullanım: node tools/ornek-veri-uret.mjs
   Gerçek içerik geldiğinde bu dosyaların üzerine yazılır. */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DERSLER, KONULAR, SORULAR, KARTLAR, DOGRUMU, KRONOLOJI, ESLESTIRME, BILGILER, DENEMELER } from './icerik.mjs'
import { haritaVerisi } from './turkiye-harita.mjs'

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..')
const HEDEF = join(KOK, 'public', 'data')

const yaz = async (yol, veri) => {
  const tam = join(HEDEF, yol)
  await mkdir(dirname(tam), { recursive: true })
  await writeFile(tam, JSON.stringify(veri), 'utf8')
  return tam
}

const konuDersi = Object.fromEntries(KONULAR.map(([dersId, id]) => [id, dersId]))

/* --- Konular --- */
const konular = KONULAR.map(([dersId, id, ad], i) => ({ id, dersId, ad, sira: i + 1 }))

/* --- Sorular --- */
let sayac = 0
const sorular = SORULAR.map(([konuId, soru, secenekler, dogru, aciklama]) => ({
  id: `s${String(++sayac).padStart(5, '0')}`,
  dersId: konuDersi[konuId],
  konuId,
  soru,
  secenekler,
  dogru,
  aciklama,
}))

/* --- Kartlar --- */
let kSayac = 0
const kartlar = KARTLAR.map(([konuId, on, arka]) => ({
  id: `k${String(++kSayac).padStart(5, '0')}`,
  dersId: konuDersi[konuId],
  konuId,
  on,
  arka,
}))

const grupla = (liste) =>
  liste.reduce((acc, x) => {
    ;(acc[x.dersId] ||= []).push(x)
    return acc
  }, {})

const sorularByDers = grupla(sorular)
const kartlarByDers = grupla(kartlar)

/* --- Denemeler --- */
const denemeler = DENEMELER.map((d) => {
  const bolumler = d.bolumler.map((b) => ({
    ...b,
    sorular: (sorularByDers[b.dersId] || []).map((s) => ({ ...s })),
  }))
  const soruSayisi = bolumler.reduce((a, b) => a + b.sorular.length, 0)
  return { meta: { ...d, soruSayisi, bolumler: undefined }, tam: { ...d, soruSayisi, bolumler } }
})

/* --- Yazma --- */
const yazilan = []

for (const d of DERSLER) {
  yazilan.push(await yaz(`sorular/${d.id}.json`, sorularByDers[d.id] || []))
  yazilan.push(await yaz(`kartlar/${d.id}.json`, kartlarByDers[d.id] || []))
}

yazilan.push(await yaz('konular.json', konular))
yazilan.push(
  await yaz(
    'bilgiler.json',
    BILGILER.map(([metin, ders], i) => ({ id: `b${i + 1}`, metin, ders }))
  )
)
yazilan.push(
  await yaz(
    'denemeler.json',
    denemeler.map((x) => {
      const m = { ...x.meta }
      delete m.bolumler
      return m
    })
  )
)
for (const x of denemeler) yazilan.push(await yaz(`denemeler/${x.tam.id}.json`, x.tam))

yazilan.push(await yaz('oyunlar/harita.json', haritaVerisi()))
yazilan.push(
  await yaz(
    'oyunlar/kronoloji.json',
    KRONOLOJI.map(([ad, yil], i) => ({ id: `kr${i + 1}`, ad, yil }))
  )
)
yazilan.push(
  await yaz(
    'oyunlar/eslestirme.json',
    ESLESTIRME.map(([sol, sag], i) => ({ id: `es${i + 1}`, sol, sag }))
  )
)
yazilan.push(
  await yaz(
    'oyunlar/dogrumu.json',
    DOGRUMU.map(([ifade, dogru, aciklama], i) => ({ id: `dm${i + 1}`, ifade, dogru, aciklama }))
  )
)

const index = {
  surum: 1,
  guncelleme: new Date().toISOString().slice(0, 10),
  kaynak: 'ornek',
  dersler: DERSLER.map((d) => ({
    ...d,
    soruSayisi: (sorularByDers[d.id] || []).length,
    kartSayisi: (kartlarByDers[d.id] || []).length,
    konuSayisi: konular.filter((k) => k.dersId === d.id).length,
  })),
  istatistik: {
    sorular: sorular.length,
    kartlar: kartlar.length,
    konular: konular.length,
    denemeler: denemeler.length,
  },
}
yazilan.push(await yaz('index.json', index))

console.log(`✓ ${yazilan.length} dosya yazıldı → public/data`)
console.log(`  ${index.istatistik.sorular} soru · ${index.istatistik.kartlar} kart · ${index.istatistik.konular} konu · ${index.istatistik.denemeler} deneme`)
