#!/usr/bin/env node
/**
 * Android kaynak kodundaki HAZIR VERİYİ web sürümüne aktarır.
 *
 * Android uygulamasında bazı içerikler assets/ altında değil, doğrudan Kotlin
 * kaynağında sabit olarak duruyor:
 *   • Models.kt                  → 113 konu (ders/konu adları ve soru sayıları)
 *   • HaritaOyunlariActivity.kt  → Türkiye sınır poligonu, Marmara, 53 coğrafi
 *                                  nokta (gerçek enlem/boylam + açıklama + Wikipedia başlığı)
 *   • OyunlarActivity.kt         → kronoloji olayları
 *
 * Kullanım:
 *   node tools/android-veri-cikar.mjs <android-proje-klasoru>
 *   (ör. node tools/android-veri-cikar.mjs ../kpss-app)
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..')
const kaynak = process.argv[2]
if (!kaynak) {
  console.error('Kullanım: node tools/android-veri-cikar.mjs <android-proje-klasoru>')
  process.exit(1)
}
const JAVA = join(kaynak, 'app/src/main/java/com/nihangokdemir/kpss')
const HEDEF = join(KOK, 'public', 'data')

const oku = (p) => readFile(join(JAVA, p), 'utf8')
const yaz = async (yol, veri) => {
  const tam = join(HEDEF, yol)
  await mkdir(dirname(tam), { recursive: true })
  await writeFile(tam, JSON.stringify(veri), 'utf8')
}

/* ── Harita: sınır + projeksiyon ───────────────────────────── */
const GENISLIK = 1000
const LAT_MIN = 35.8
const LAT_MAX = 42.2
const LON_MIN = 25.5
const LON_MAX = 44.8
const LAT0 = 39
const YUKSEKLIK = Math.round((GENISLIK * (LAT_MAX - LAT_MIN)) / ((LON_MAX - LON_MIN) * Math.cos((LAT0 * Math.PI) / 180)))

const izdusum = (lat, lon) => [
  +(((lon - LON_MIN) / (LON_MAX - LON_MIN)) * GENISLIK).toFixed(1),
  +(((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * YUKSEKLIK).toFixed(1),
]

/** "41.75 to 26.05, 42.05 to 26.60, …" → [[lat,lon], …] */
function ciftleriAyikla(gövde) {
  return [...gövde.matchAll(/(-?\d+\.\d+)\s+to\s+(-?\d+\.\d+)/g)].map((m) => [Number(m[1]), Number(m[2])])
}

function blokAl(metin, baslangicDeseni) {
  const i = metin.search(baslangicDeseni)
  if (i < 0) return ''
  const acik = metin.indexOf('(', i)
  let derinlik = 0
  for (let j = acik; j < metin.length; j++) {
    if (metin[j] === '(') derinlik++
    else if (metin[j] === ')') {
      derinlik--
      if (derinlik === 0) return metin.slice(acik + 1, j)
    }
  }
  return ''
}

async function haritaCikar() {
  const src = await oku('ui/HaritaOyunlariActivity.kt')

  const sinir = ciftleriAyikla(blokAl(src, /private val TURKIYE_SINIR\s*=\s*listOf/))
  const marmara = ciftleriAyikla(blokAl(src, /private val MARMARA\s*=\s*listOf/))
  if (sinir.length < 10) throw new Error('TURKIYE_SINIR okunamadı')

  const yolYap = (noktalar) =>
    'M' + noktalar.map(([la, lo]) => izdusum(la, lo).join(',')).join(' L') + ' Z'

  // Kategoriler ve noktalar
  const kategoriler = []
  const katDeseni = /HaritaKategori\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*Color\(0x([0-9A-Fa-f]{8})\)/g
  const katKonumlari = [...src.matchAll(katDeseni)].map((m) => ({
    id: m[1],
    ad: m[2],
    renk: '#' + m[3].slice(2), // 0xFFRRGGBB → #RRGGBB
    index: m.index,
  }))

  const noktaDeseni =
    /CografiNokta\(\s*"((?:[^"\\]|\\.)*)"\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*"([^"]+)"(?:\s*,\s*"((?:[^"\\]|\\.)*)")?(?:\s*,\s*wikiBaslik\s*=\s*"((?:[^"\\]|\\.)*)")?/g
  const tumNoktalar = [...src.matchAll(noktaDeseni)].map((m) => ({
    ad: m[1].replace(/\\"/g, '"'),
    lat: Number(m[2]),
    lon: Number(m[3]),
    kategori: m[4],
    bilgi: (m[5] || '').replace(/\\"/g, '"'),
    wiki: m[6] || '',
  }))

  for (const k of katKonumlari) {
    const ogeler = tumNoktalar
      .filter((n) => n.kategori === k.id)
      .map((n) => {
        const [x, y] = izdusum(n.lat, n.lon)
        return { ad: n.ad, x, y, lat: n.lat, lon: n.lon, bilgi: n.bilgi, wiki: n.wiki }
      })
    if (ogeler.length) kategoriler.push({ id: k.id, ad: k.ad, renk: k.renk, ogeler })
  }

  return {
    viewBox: `0 0 ${GENISLIK} ${YUKSEKLIK}`,
    path: yolYap(sinir),
    marmara: marmara.length ? yolYap(marmara) : null,
    // Mesafe hesabı için sınırlar (haversine ile km sapması hesaplanır)
    sinirlar: { latMin: LAT_MIN, latMax: LAT_MAX, lonMin: LON_MIN, lonMax: LON_MAX },
    kategoriler,
  }
}

/* ── Kronoloji ─────────────────────────────────────────────── */
async function kronolojiCikar() {
  const src = await oku('ui/OyunlarActivity.kt')
  const olaylar = [...src.matchAll(/KronolojiOlay\(\s*(\d{3,4})\s*,\s*"((?:[^"\\]|\\.)*)"\s*\)/g)].map((m, i) => ({
    id: `kr${i + 1}`,
    yil: Number(m[1]),
    ad: m[2].replace(/\\"/g, '"'),
  }))
  // Aynı yıl birden çok olay varsa sıralama belirsiz olur — oyunda yıl eşitliği
  // doğru kabul edildiği için sorun değil, yine de uyar.
  const yillar = new Set(olaylar.map((o) => o.yil))
  if (yillar.size !== olaylar.length) {
    console.warn(`  ! ${olaylar.length - yillar.size} olay aynı yılı paylaşıyor (oyunda eşit sayılır)`)
  }
  return olaylar
}

/* ── Konular ───────────────────────────────────────────────── */
const DERS_META = {
  turkce: { ad: 'Türkçe', grup: 'gy', ikon: 'turkce', renk: '#2a78d6', renkKoyu: '#3987e5' },
  matematik: { ad: 'Matematik', grup: 'gy', ikon: 'matematik', renk: '#eb6834', renkKoyu: '#d95926' },
  tarih: { ad: 'Tarih', grup: 'gk', ikon: 'tarih', renk: '#1baf7a', renkKoyu: '#199e70' },
  cografya: { ad: 'Coğrafya', grup: 'gk', ikon: 'cografya', renk: '#eda100', renkKoyu: '#c98500' },
  vatandaslik: { ad: 'Vatandaşlık', grup: 'gk', ikon: 'vatandaslik', renk: '#e87ba4', renkKoyu: '#d55181' },
  guncel: { ad: 'Güncel Bilgiler', grup: 'gk', ikon: 'guncel', renk: '#008300', renkKoyu: '#008300' },
  egitimbilimleri: { ad: 'Eğitim Bilimleri', grup: 'eb', ikon: 'egitimbilimleri', renk: '#4a3aa7', renkKoyu: '#9085e9' },
  hukuk: { ad: 'Hukuk', grup: 'ab', ikon: 'vatandaslik', renk: '#e34948', renkKoyu: '#e66767' },
  iktisat: { ad: 'İktisat', grup: 'ab', ikon: 'matematik', renk: '#2a78d6', renkKoyu: '#3987e5' },
  maliye: { ad: 'Maliye', grup: 'ab', ikon: 'matematik', renk: '#eb6834', renkKoyu: '#d95926' },
  muhasebe: { ad: 'Muhasebe', grup: 'ab', ikon: 'matematik', renk: '#1baf7a', renkKoyu: '#199e70' },
  isletme: { ad: 'İşletme', grup: 'ab', ikon: 'guncel', renk: '#eda100', renkKoyu: '#c98500' },
  kamuyonetimi: { ad: 'Kamu Yönetimi', grup: 'ab', ikon: 'vatandaslik', renk: '#e87ba4', renkKoyu: '#d55181' },
  uluslararasiiliskiler: { ad: 'Uluslararası İlişkiler', grup: 'ab', ikon: 'cografya', renk: '#4a3aa7', renkKoyu: '#9085e9' },
}

async function konularCikar() {
  const src = await oku('data/Models.kt')
  const konular = [...src.matchAll(/Konu\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"((?:[^"\\]|\\.)*)"\s*,\s*(\d+)/g)].map(
    (m, i) => ({ id: m[1], dersId: m[2], ad: m[3].replace(/\\"/g, '"'), soruSayisi: Number(m[4]), sira: i + 1 })
  )
  return konular
}

/* ── Çalıştır ──────────────────────────────────────────────── */
console.log(`• Android kaynağı: ${JAVA}`)

const harita = await haritaCikar()
await yaz('oyunlar/harita.json', harita)
console.log(
  `  ✓ harita.json — ${harita.kategoriler.length} kategori, ` +
    `${harita.kategoriler.reduce((a, k) => a + k.ogeler.length, 0)} konum, sınır poligonu aktarıldı`
)

const kronoloji = await kronolojiCikar()
await yaz('oyunlar/kronoloji.json', kronoloji)
console.log(`  ✓ kronoloji.json — ${kronoloji.length} olay`)

const konular = await konularCikar()
await yaz('konular.json', konular.map(({ soruSayisi, ...k }) => k))
console.log(`  ✓ konular.json — ${konular.length} konu`)

// index.json'daki ders listesini konu sayılarıyla güncelle (soru/kart sayıları
// gerçek assets içe aktarılınca import-android-assets.mjs tarafından yazılır)
const dersIdler = [...new Set(konular.map((k) => k.dersId))]
const mevcut = await readFile(join(HEDEF, 'index.json'), 'utf8').then(JSON.parse).catch(() => null)
// Soru/kart sayıları GERÇEK dosyalardan okunur. Models.kt'deki sabit sayılar
// kullanılmaz: dosya yoksa 0 yazılır, böylece arayüz olmayan içeriği vaat etmez.
const sayDosya = async (yol) => {
  try {
    const j = JSON.parse(await readFile(join(HEDEF, yol), 'utf8'))
    return Array.isArray(j) ? j.length : 0
  } catch {
    return 0
  }
}
const dersler = []
for (const id of dersIdler) {
  dersler.push({
    id,
    ...(DERS_META[id] || { ad: id, grup: 'gk', ikon: 'tarih', renk: '#667492', renkKoyu: '#898781' }),
    soruSayisi: await sayDosya(`sorular/${id}.json`),
    kartSayisi: await sayDosya(`kartlar/${id}.json`),
    konuSayisi: konular.filter((k) => k.dersId === id).length,
  })
}
await yaz('index.json', {
  surum: 1,
  guncelleme: new Date().toISOString().slice(0, 10),
  kaynak: 'android-kod',
  dersler,
  istatistik: {
    sorular: dersler.reduce((a, d) => a + d.soruSayisi, 0),
    kartlar: dersler.reduce((a, d) => a + d.kartSayisi, 0),
    konular: konular.length,
    denemeler: mevcut?.istatistik?.denemeler ?? 0,
  },
})
console.log(`  ✓ index.json — ${dersler.length} ders`)
console.log(
  '\nNot: soru ve kart dosyaları assets klasöründen gelir —\n' +
    '     npm run import:assets -- <android>/app/src/main/assets'
)
