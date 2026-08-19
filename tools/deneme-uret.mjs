#!/usr/bin/env node
/**
 * GERÇEK deneme sınavlarını üretir.
 *
 * Neden gerekli: web sürümünde 4 adet ÖRNEK deneme vardı (18–30 soruluk).
 * Android bunları kod içinde, çalışma anında üretiyor; aktarımda o üreteç
 * taşınmamıştı. Burada 16.066 soruluk gerçek havuzdan, ÖSYM'nin soru
 * dağılımına ve sürelerine uygun denemeler üretiliyor.
 *
 * İlkeler:
 * - Soru dağılımı gerçek KPSS ağırlıklarına göre (Türkçe 30, Matematik 30,
 *   Tarih 27, Coğrafya 18, Vatandaşlık 9, Güncel 6 …).
 * - Bir soru YALNIZCA BİR denemede kullanılır; denemeler arası tekrar yok.
 * - Konu dağılımı da dengelenir: bir dersin soruları tek konudan seçilmez,
 *   konular sırayla dolaşılır.
 * - Rastgelelik TOHUMLU: aynı girdi her zaman aynı denemeleri üretir, böylece
 *   yeniden derlemede denemeler değişmez (kullanıcının yarım kalan sınavı
 *   bozulmaz).
 *
 * Çalıştırma:  npm run deneme:uret
 */

import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..')
const VERI = join(KOK, 'public/data')

/* ── Tohumlu rastgelelik (mulberry32) ───────────────────────────
   Math.random() kullanılsaydı her derlemede farklı denemeler çıkardı. */
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

/* ── Sınav tanımları ─────────────────────────────────────────────
   Kaynak: ÖSYM KPSS kılavuzu soru dağılımı ve süreleri. */
const GY_GK = {
  onEk: 'gygk',
  ad: (i) => `KPSS Genel Yetenek – Genel Kültür Denemesi ${i}`,
  aciklama: 'Gerçek sınav düzeni: 120 soru, 130 dakika',
  tur: 'genel',
  sure: 130,
  puanTuru: 'P3',
  renk: '#2a78d6',
  adet: 10,
  bolumler: [
    { dersId: 'turkce', ad: 'Türkçe', n: 30 },
    { dersId: 'matematik', ad: 'Matematik', n: 30 },
    { dersId: 'tarih', ad: 'Tarih', n: 27 },
    { dersId: 'cografya', ad: 'Coğrafya', n: 18 },
    { dersId: 'vatandaslik', ad: 'Vatandaşlık', n: 9 },
    { dersId: 'guncel', ad: 'Güncel Bilgiler', n: 6 },
  ],
}

const EGITIM = {
  onEk: 'eb',
  ad: (i) => `Eğitim Bilimleri Denemesi ${i}`,
  aciklama: 'Öğretmenlik oturumu düzeni: 80 soru, 100 dakika',
  tur: 'genel',
  sure: 100,
  puanTuru: 'P10',
  renk: '#7c5cd6',
  adet: 5,
  bolumler: [{ dersId: 'egitimbilimleri', ad: 'Eğitim Bilimleri', n: 80 }],
}

/* A grubu alan bilgisi dersleri — her biri 40 soru / 50 dk */
const ALAN_DERSLER = [
  ['hukuk', 'Hukuk', '#c2410c'],
  ['iktisat', 'İktisat', '#0f766e'],
  ['maliye', 'Maliye', '#b45309'],
  ['muhasebe', 'Muhasebe', '#a16207'],
  ['isletme', 'İşletme', '#1d4ed8'],
  ['kamuyonetimi', 'Kamu Yönetimi', '#be123c'],
  ['uluslararasiiliskiler', 'Uluslararası İlişkiler', '#4338ca'],
]

/* Branş denemeleri — tek ders, 30 soru / 35 dk */
const BRANS_DERSLER = [
  ['turkce', 'Türkçe', '#0891b2'],
  ['matematik', 'Matematik', '#2563eb'],
  ['tarih', 'Tarih', '#b91c1c'],
  ['cografya', 'Coğrafya', '#ca8a04'],
  ['vatandaslik', 'Vatandaşlık', '#059669'],
  ['guncel', 'Güncel Bilgiler', '#7c3aed'],
  ['egitimbilimleri', 'Eğitim Bilimleri', '#7c5cd6'],
  ...ALAN_DERSLER,
]

/* ── Havuz ──────────────────────────────────────────────────────
   Her ders için sorular konulara göre gruplanır; seçim konular arasında
   sırayla dolaşılarak yapılır ki bir deneme tek konuya yığılmasın. */
async function havuzKur(dersler, rnd) {
  const havuz = new Map()
  for (const d of dersler) {
    let sorular = []
    try {
      sorular = JSON.parse(await readFile(join(VERI, `sorular/${d}.json`), 'utf8'))
    } catch {
      continue
    }
    const konular = new Map()
    for (const s of karistir(sorular, rnd)) {
      const k = s.konuId || '_'
      if (!konular.has(k)) konular.set(k, [])
      konular.get(k).push(s)
    }
    havuz.set(d, { konular: karistir([...konular.keys()], rnd), gruplar: konular, imlec: 0 })
  }
  return havuz
}

/** Havuzdan n soru çeker; konular arasında sırayla dolaşır. Yetmezse azını verir. */
function cek(havuz, dersId, n) {
  const h = havuz.get(dersId)
  if (!h) return []
  const alinan = []
  let bosTur = 0
  while (alinan.length < n && bosTur < h.konular.length) {
    const k = h.konular[h.imlec % h.konular.length]
    h.imlec++
    const g = h.gruplar.get(k)
    if (g && g.length) {
      alinan.push(g.shift())
      bosTur = 0
    } else {
      bosTur++
    }
  }
  return alinan
}

/* ── Üretim ─────────────────────────────────────────────────────── */
const rnd = rastgele(20260819) // sabit tohum → tekrarlanabilir çıktı
const tumDersler = [...new Set([...GY_GK.bolumler.map((b) => b.dersId), 'egitimbilimleri', ...BRANS_DERSLER.map((b) => b[0])])]
const havuz = await havuzKur(tumDersler, rnd)

const denemeler = []
const dosyalar = []

function ekle(meta, bolumler) {
  const soruSayisi = bolumler.reduce((t, b) => t + b.sorular.length, 0)
  if (!soruSayisi) return
  denemeler.push({ ...meta, soruSayisi })
  dosyalar.push({ ...meta, soruSayisi, bolumler })
}

/* 1) Genel Yetenek – Genel Kültür */
for (let i = 1; i <= GY_GK.adet; i++) {
  const bolumler = GY_GK.bolumler
    .map((b) => ({ dersId: b.dersId, ad: b.ad, sorular: cek(havuz, b.dersId, b.n) }))
    .filter((b) => b.sorular.length)
  ekle(
    {
      id: `${GY_GK.onEk}-${i}`,
      ad: GY_GK.ad(i),
      tur: GY_GK.tur,
      sure: GY_GK.sure,
      puanTuru: GY_GK.puanTuru,
      renk: GY_GK.renk,
      aciklama: GY_GK.aciklama,
    },
    bolumler
  )
}

/* 2) Eğitim Bilimleri */
for (let i = 1; i <= EGITIM.adet; i++) {
  const bolumler = EGITIM.bolumler
    .map((b) => ({ dersId: b.dersId, ad: b.ad, sorular: cek(havuz, b.dersId, b.n) }))
    .filter((b) => b.sorular.length)
  ekle(
    {
      id: `${EGITIM.onEk}-${i}`,
      ad: EGITIM.ad(i),
      tur: EGITIM.tur,
      sure: EGITIM.sure,
      puanTuru: EGITIM.puanTuru,
      renk: EGITIM.renk,
      aciklama: EGITIM.aciklama,
    },
    bolumler
  )
}

/* 3) Alan bilgisi — ders başına 3 deneme, 40 soru / 50 dk */
for (const [dersId, ad, renk] of ALAN_DERSLER) {
  for (let i = 1; i <= 3; i++) {
    const sorular = cek(havuz, dersId, 40)
    ekle(
      {
        id: `alan-${dersId}-${i}`,
        ad: `${ad} Alan Bilgisi Denemesi ${i}`,
        tur: 'alan',
        sure: 50,
        puanTuru: 'P3',
        renk,
        aciklama: 'A grubu alan bilgisi düzeni: 40 soru, 50 dakika',
      },
      [{ dersId, ad, sorular }]
    )
  }
}

/* 4) Branş — ders başına 2 deneme, 30 soru / 35 dk */
for (const [dersId, ad, renk] of BRANS_DERSLER) {
  for (let i = 1; i <= 2; i++) {
    const sorular = cek(havuz, dersId, 30)
    ekle(
      {
        id: `brans-${dersId}-${i}`,
        ad: `${ad} Branş Denemesi ${i}`,
        tur: 'brans',
        sure: 35,
        puanTuru: 'P3',
        renk,
        aciklama: `Yalnızca ${ad} — 30 soru, 35 dakika`,
      },
      [{ dersId, ad, sorular }]
    )
  }
}

/* ── Yazma ─────────────────────────────────────────────────────── */
const klasor = join(VERI, 'denemeler')
await rm(klasor, { recursive: true, force: true })
await mkdir(klasor, { recursive: true })
for (const d of dosyalar) await writeFile(join(klasor, `${d.id}.json`), JSON.stringify(d), 'utf8')
await writeFile(join(VERI, 'denemeler.json'), JSON.stringify(denemeler), 'utf8')

/* ── Rapor ─────────────────────────────────────────────────────── */
const toplamSoru = denemeler.reduce((t, d) => t + d.soruSayisi, 0)
const tur = {}
for (const d of denemeler) tur[d.tur] = (tur[d.tur] || 0) + 1
console.log(`  ✓ ${denemeler.length} deneme üretildi — toplam ${toplamSoru.toLocaleString('tr-TR')} soru`)
for (const [t, n] of Object.entries(tur)) console.log(`     ${t}: ${n} deneme`)

/* Tekrar denetimi: aynı soru iki denemede olmamalı */
const gorulen = new Set()
let tekrar = 0
for (const d of dosyalar) for (const b of d.bolumler) for (const s of b.sorular) {
  if (gorulen.has(s.id)) tekrar++
  gorulen.add(s.id)
}
console.log(`  ✓ tekrar eden soru: ${tekrar} (0 olmalı) · benzersiz soru: ${gorulen.size}`)
const eksik = dosyalar.filter((d) => d.bolumler.some((b) => b.sorular.length === 0))
if (eksik.length) console.log('  ! soru bulunamayan bölüm içeren deneme:', eksik.map((d) => d.id).join(', '))
