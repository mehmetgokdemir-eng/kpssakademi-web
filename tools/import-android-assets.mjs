#!/usr/bin/env node
/**
 * Android uygulamasındaki içeriği web sürümünün veri biçimine çevirir.
 *
 * Kullanım:
 *   node tools/import-android-assets.mjs <kaynak-klasör> [--cikti public/data] [--kuru] [--taban 0|1]
 *
 * --kuru  : dosya yazmadan ne bulunduğunu raporlar (önce bunu çalıştırın)
 * --taban : doğru cevap sayısal ise numaralandırmanın 0 mı 1 mi tabanlı olduğu
 *           (belirtilmezse veriye bakılarak otomatik saptanır)
 *
 * <kaynak-klasör> olarak Android projesindeki `app/src/main/assets` klasörünü
 * (ya da içinde JSON/CSV/SQLite dosyaları bulunan herhangi bir klasörü) verin.
 *
 * Desteklenen kaynaklar:
 *   • .json  — dizi ya da { veri: [...] } / { sorular: [...] } sarmalayıcıları
 *   • .csv   — ilk satır başlık
 *   • .db / .sqlite / .sqlite3 — tablolar otomatik taranır (Node 22+ node:sqlite)
 *
 * Alan adları otomatik eşlenir (Türkçe ve İngilizce yaygın adlar). Eşleşmeyen
 * bir şema varsa tools/alan-eslesme.json dosyası oluşturup elle tanımlayın:
 *   { "soru": ["question_text"], "dogru": ["answer_index"] }
 */

import { readdir, readFile, writeFile, mkdir, stat, access } from 'node:fs/promises'
import { join, dirname, extname, basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..')

/* ---------- CLI ---------- */
const argv = process.argv.slice(2)
const kaynak = argv.find((a) => !a.startsWith('--'))
const bayrak = (ad, varsayilan = null) => {
  const i = argv.indexOf(`--${ad}`)
  return i >= 0 ? argv[i + 1] ?? true : varsayilan
}
const KURU = argv.includes('--kuru') || argv.includes('--dry-run')
const CIKTI = resolve(KOK, bayrak('cikti', 'public/data'))

if (!kaynak) {
  console.error('Kullanım: node tools/import-android-assets.mjs <kaynak-klasör> [--cikti public/data] [--kuru]')
  process.exit(1)
}

/* ---------- Alan eşleme sözlüğü ---------- */
const VARSAYILAN_ESLESME = {
  id: ['id', '_id', 'soru_id', 'soruid', 'questionid', 'question_id', 'kart_id', 'kartid'],
  soru: ['soru', 'soru_metni', 'sorumetni', 'question', 'question_text', 'text', 'metin', 'baslik'],
  secenekler: ['secenekler', 'siklar', 'options', 'choices', 'answers', 'cevaplar'],
  secenekTekil: [
    ['a', 'b', 'c', 'd', 'e'],
    ['secenek_a', 'secenek_b', 'secenek_c', 'secenek_d', 'secenek_e'],
    ['secenekA', 'secenekB', 'secenekC', 'secenekD', 'secenekE'],
    ['sik_a', 'sik_b', 'sik_c', 'sik_d', 'sik_e'],
    ['option_a', 'option_b', 'option_c', 'option_d', 'option_e'],
    ['cevap1', 'cevap2', 'cevap3', 'cevap4', 'cevap5'],
    ['secenek1', 'secenek2', 'secenek3', 'secenek4', 'secenek5'],
  ],
  dogru: ['dogru', 'dogru_cevap', 'dogrucevap', 'dogruSik', 'cevap', 'answer', 'correct', 'correct_answer', 'correctIndex', 'dogru_index'],
  aciklama: ['aciklama', 'cozum', 'explanation', 'solution', 'detay', 'bilgi'],
  dersId: ['dersId', 'ders_id', 'ders', 'subject', 'subject_id', 'kategori', 'category'],
  konuId: ['konuId', 'konu_id', 'konu', 'topic', 'topic_id', 'unite', 'alt_kategori'],
  konuAd: ['konu_adi', 'konuAd', 'topic_name', 'konuBaslik'],
  gorsel: ['gorsel', 'resim', 'image', 'image_url', 'img'],
  zorluk: ['zorluk', 'difficulty', 'seviye', 'level'],
  // kartlar
  on: ['on', 'onYuz', 'on_yuz', 'front', 'soru', 'terim', 'baslik', 'kavram'],
  arka: ['arka', 'arkaYuz', 'arka_yuz', 'back', 'cevap', 'tanim', 'aciklama', 'icerik'],
  etiketler: ['etiketler', 'tags', 'hashtag', 'etiket'],
}

const HARF_INDEKS = { a: 0, b: 1, c: 2, d: 3, e: 4, A: 0, B: 1, C: 2, D: 3, E: 4 }

const normalizeAnahtar = (k) =>
  String(k)
    .trim()
    .toLowerCase()
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
    .replace(/[\s_-]+/g, '')

function alanBul(nesne, adaylar) {
  const harita = new Map(Object.keys(nesne).map((k) => [normalizeAnahtar(k), k]))
  for (const a of adaylar) {
    const k = harita.get(normalizeAnahtar(a))
    if (k != null && nesne[k] !== '' && nesne[k] != null) return nesne[k]
  }
  return undefined
}

function seceneklerCikar(nesne, eslesme) {
  const toplu = alanBul(nesne, eslesme.secenekler)
  if (Array.isArray(toplu)) return toplu.map(String)
  if (typeof toplu === 'string') {
    // "A) ... |B) ..." veya JSON dizisi olabilir
    const kirp = toplu.trim()
    if (kirp.startsWith('[')) {
      try {
        const j = JSON.parse(kirp)
        if (Array.isArray(j)) return j.map(String)
      } catch {}
    }
    for (const ayrac of ['|', '||', ';;', '\n', ';']) {
      if (kirp.includes(ayrac)) return kirp.split(ayrac).map((s) => s.trim()).filter(Boolean)
    }
  }
  for (const set of eslesme.secenekTekil) {
    const degerler = set.map((k) => alanBul(nesne, [k]))
    const dolu = degerler.filter((v) => v != null && String(v).trim() !== '')
    if (dolu.length >= 4) return dolu.map(String)
  }
  return null
}

/** Bir veri kümesindeki sayısal doğru-cevap alanının 0 mı 1 mi tabanlı olduğunu belirler. */
function tabanBelirle(satirlar, eslesme) {
  let enKucuk = Infinity
  let enBuyuk = -Infinity
  let sayisalVar = false
  for (const s of satirlar) {
    if (!s || typeof s !== 'object') continue
    const ham = alanBul(s, eslesme.dogru)
    if (ham == null) continue
    const n = typeof ham === 'number' ? ham : /^[0-9]+$/.test(String(ham).trim()) ? Number(ham) : null
    if (n == null) continue
    sayisalVar = true
    enKucuk = Math.min(enKucuk, n)
    enBuyuk = Math.max(enBuyuk, n)
  }
  if (!sayisalVar) return 0
  if (enKucuk === 0) return 0 // 0 görülüyorsa kesin 0 tabanlı
  if (enKucuk >= 1 && enBuyuk >= 5) return 1 // 1..5 → 1 tabanlı
  return 1 // hiç 0 yoksa 1 tabanlı varsay
}

function dogruIndeks(nesne, secenekler, eslesme, taban = 0) {
  const ham = alanBul(nesne, eslesme.dogru)
  if (ham == null) return null
  if (typeof ham === 'number') return ham - taban
  const s = String(ham).trim()
  if (/^[0-9]+$/.test(s)) return Number(s) - taban
  if (s.length === 1 && HARF_INDEKS[s] != null) return HARF_INDEKS[s]
  const ix = secenekler.findIndex((x) => String(x).trim() === s)
  return ix >= 0 ? ix : null
}

/* ---------- Kaynak okuma ---------- */
async function varMi(p) {
  try {
    await access(p)
    return true
  } catch {
    return false
  }
}

async function* dosyalar(dizin) {
  for (const e of await readdir(dizin, { withFileTypes: true })) {
    const tam = join(dizin, e.name)
    if (e.isDirectory()) yield* dosyalar(tam)
    else yield tam
  }
}

function csvAyristir(metin) {
  const satirlar = []
  let alan = ''
  let satir = []
  let tirnak = false
  for (let i = 0; i < metin.length; i++) {
    const c = metin[i]
    if (tirnak) {
      if (c === '"' && metin[i + 1] === '"') {
        alan += '"'
        i++
      } else if (c === '"') tirnak = false
      else alan += c
    } else if (c === '"') tirnak = true
    else if (c === ',' || c === ';') {
      satir.push(alan)
      alan = ''
    } else if (c === '\n') {
      satir.push(alan)
      satirlar.push(satir)
      satir = []
      alan = ''
    } else if (c !== '\r') alan += c
  }
  if (alan || satir.length) {
    satir.push(alan)
    satirlar.push(satir)
  }
  const [basliklar, ...geri] = satirlar
  if (!basliklar) return []
  return geri
    .filter((s) => s.some((x) => x.trim() !== ''))
    .map((s) => Object.fromEntries(basliklar.map((b, i) => [b.trim(), (s[i] ?? '').trim()])))
}

async function sqliteOku(yol) {
  let DatabaseSync
  try {
    ;({ DatabaseSync } = await import('node:sqlite'))
  } catch {
    console.warn(`  ! ${basename(yol)} atlandı — node:sqlite yok (Node 22+ gerekir)`)
    return []
  }
  const db = new DatabaseSync(yol, { readOnly: true })
  const tablolar = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'android_%' AND name NOT LIKE 'room_%'").all()
  const cikti = []
  for (const t of tablolar) {
    try {
      const satirlar = db.prepare(`SELECT * FROM "${t.name}"`).all()
      if (satirlar.length) cikti.push({ kaynak: `${basename(yol)}#${t.name}`, satirlar })
    } catch (e) {
      console.warn(`  ! ${t.name} okunamadı: ${e.message}`)
    }
  }
  db.close()
  return cikti
}

function jsonKokBul(veri) {
  if (Array.isArray(veri)) return [{ kaynak: '', satirlar: veri }]
  if (veri && typeof veri === 'object') {
    const cikti = []
    for (const [k, v] of Object.entries(veri)) {
      if (Array.isArray(v) && v.length && typeof v[0] === 'object') cikti.push({ kaynak: k, satirlar: v })
    }
    return cikti
  }
  return []
}

/* ---------- Ana akış ---------- */
const eslesmeYolu = join(KOK, 'tools', 'alan-eslesme.json')
let eslesme = VARSAYILAN_ESLESME
if (await varMi(eslesmeYolu)) {
  const ek = JSON.parse(await readFile(eslesmeYolu, 'utf8'))
  eslesme = { ...VARSAYILAN_ESLESME }
  for (const [k, v] of Object.entries(ek)) eslesme[k] = [...(Array.isArray(v) ? v : [v]), ...(VARSAYILAN_ESLESME[k] || [])]
  console.log('• tools/alan-eslesme.json kullanılıyor')
}

const kaynakYol = resolve(process.cwd(), kaynak)
if (!(await varMi(kaynakYol))) {
  console.error(`Kaynak bulunamadı: ${kaynakYol}`)
  process.exit(1)
}

console.log(`• Kaynak: ${kaynakYol}`)
const kumeler = []
const st = await stat(kaynakYol)
const liste = st.isDirectory() ? [] : [kaynakYol]
if (st.isDirectory()) for await (const f of dosyalar(kaynakYol)) liste.push(f)

for (const f of liste) {
  const uzanti = extname(f).toLowerCase()
  try {
    if (uzanti === '.json') {
      const veri = JSON.parse(await readFile(f, 'utf8'))
      for (const k of jsonKokBul(veri)) kumeler.push({ dosya: f, kaynak: k.kaynak || basename(f, '.json'), satirlar: k.satirlar })
    } else if (uzanti === '.csv' || uzanti === '.tsv') {
      const satirlar = csvAyristir(await readFile(f, 'utf8'))
      if (satirlar.length) kumeler.push({ dosya: f, kaynak: basename(f, uzanti), satirlar })
    } else if (['.db', '.sqlite', '.sqlite3'].includes(uzanti)) {
      for (const k of await sqliteOku(f)) kumeler.push({ dosya: f, kaynak: k.kaynak, satirlar: k.satirlar })
    }
  } catch (e) {
    console.warn(`  ! ${basename(f)} okunamadı: ${e.message}`)
  }
}

console.log(`• ${kumeler.length} veri kümesi bulundu`)

/* Kümeleri türlerine göre ayır */
const sorular = []
const kartlar = []
const konuAdlari = new Map()

const slug = (s) =>
  normalizeAnahtar(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'genel'

for (const kume of kumeler) {
  let soruSayisi = 0
  let kartSayisi = 0
  const tabanZorla = bayrak('taban', null)
  const taban = tabanZorla != null ? Number(tabanZorla) : tabanBelirle(kume.satirlar, eslesme)
  if (tabanZorla == null && taban === 1 && kume.satirlar.length < 20) {
    console.warn(`  ? ${kume.kaynak}: doğru cevap numaralandırması 1 tabanlı varsayıldı (az satır). Yanlışsa --taban 0 kullanın.`)
  }
  for (const satir of kume.satirlar) {
    if (!satir || typeof satir !== 'object') continue

    const soruMetni = alanBul(satir, eslesme.soru)
    const secenekler = seceneklerCikar(satir, eslesme)

    if (soruMetni && secenekler && secenekler.length >= 4) {
      const dogru = dogruIndeks(satir, secenekler, eslesme, taban)
      if (dogru == null || dogru < 0 || dogru >= secenekler.length) continue
      const dersHam = alanBul(satir, eslesme.dersId) ?? kume.kaynak
      const konuHam = alanBul(satir, eslesme.konuId) ?? alanBul(satir, eslesme.konuAd) ?? 'genel'
      const dersId = slug(dersHam)
      const konuId = `${dersId}-${slug(konuHam)}`
      konuAdlari.set(konuId, { dersId, ad: String(alanBul(satir, eslesme.konuAd) ?? konuHam) })
      sorular.push({
        id: String(alanBul(satir, eslesme.id) ?? `${dersId}-${sorular.length + 1}`),
        dersId,
        konuId,
        soru: String(soruMetni),
        secenekler: secenekler.map((s) => String(s)),
        dogru,
        aciklama: alanBul(satir, eslesme.aciklama) ? String(alanBul(satir, eslesme.aciklama)) : undefined,
        gorsel: alanBul(satir, eslesme.gorsel) ? String(alanBul(satir, eslesme.gorsel)) : undefined,
      })
      soruSayisi++
      continue
    }

    const on = alanBul(satir, eslesme.on)
    const arka = alanBul(satir, eslesme.arka)
    if (on && arka && !secenekler) {
      const dersHam = alanBul(satir, eslesme.dersId) ?? kume.kaynak
      const konuHam = alanBul(satir, eslesme.konuId) ?? alanBul(satir, eslesme.konuAd) ?? 'genel'
      const dersId = slug(dersHam)
      const konuId = `${dersId}-${slug(konuHam)}`
      konuAdlari.set(konuId, { dersId, ad: String(alanBul(satir, eslesme.konuAd) ?? konuHam) })
      kartlar.push({
        id: String(alanBul(satir, eslesme.id) ?? `${dersId}-k${kartlar.length + 1}`),
        dersId,
        konuId,
        on: String(on),
        arka: String(arka),
      })
      kartSayisi++
    }
  }
  if (soruSayisi || kartSayisi) console.log(`  · ${kume.kaynak}: ${soruSayisi} soru, ${kartSayisi} kart`)
}

if (!sorular.length && !kartlar.length) {
  console.error('\n✗ Hiç soru/kart tanınamadı. Alan adlarını tools/alan-eslesme.json ile tanımlayın.')
  console.error('  Örnek: {"soru":["question_text"],"secenekler":["opts"],"dogru":["answer_index"]}')
  process.exit(2)
}

/* Benzersiz id garantisi */
const gorulen = new Set()
for (const liste2 of [sorular, kartlar]) {
  for (const x of liste2) {
    let id = x.id
    let n = 1
    while (gorulen.has(id)) id = `${x.id}-${n++}`
    gorulen.add(id)
    x.id = id
  }
}

/* Ders listesi */
const PALET = [
  ['#2a78d6', '#3987e5'],
  ['#eb6834', '#d95926'],
  ['#1baf7a', '#199e70'],
  ['#eda100', '#c98500'],
  ['#e87ba4', '#d55181'],
  ['#008300', '#008300'],
  ['#4a3aa7', '#9085e9'],
  ['#e34948', '#e66767'],
]
const BILINEN_AD = {
  turkce: 'Türkçe',
  matematik: 'Matematik',
  tarih: 'Tarih',
  cografya: 'Coğrafya',
  vatandaslik: 'Vatandaşlık',
  guncel: 'Güncel Bilgiler',
  egitimbilimleri: 'Eğitim Bilimleri',
}
const GRUP = { turkce: 'gy', matematik: 'gy', tarih: 'gk', cografya: 'gk', vatandaslik: 'gk', guncel: 'gk', egitimbilimleri: 'eb' }

const dersIdler = [...new Set([...sorular, ...kartlar].map((x) => x.dersId))]
const dersler = dersIdler.map((id, i) => ({
  id,
  ad: BILINEN_AD[id] || id.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()),
  grup: GRUP[id] || 'gk',
  ikon: BILINEN_AD[id] ? id : 'tarih',
  renk: PALET[i % PALET.length][0],
  renkKoyu: PALET[i % PALET.length][1],
  soruSayisi: sorular.filter((s) => s.dersId === id).length,
  kartSayisi: kartlar.filter((k) => k.dersId === id).length,
  konuSayisi: [...konuAdlari.values()].filter((k) => k.dersId === id).length,
}))

const konular = [...konuAdlari.entries()].map(([id, v], i) => ({ id, dersId: v.dersId, ad: v.ad, sira: i + 1 }))

const index = {
  surum: 1,
  guncelleme: new Date().toISOString().slice(0, 10),
  kaynak: 'android-import',
  dersler,
  istatistik: { sorular: sorular.length, kartlar: kartlar.length, konular: konular.length, denemeler: 0 },
}

console.log(
  `\n→ ${sorular.length} soru · ${kartlar.length} kart · ${konular.length} konu · ${dersler.length} ders`
)
console.log(`  Dersler: ${dersler.map((d) => `${d.ad}(${d.soruSayisi})`).join(', ')}`)

if (KURU) {
  console.log('\n(kuru çalışma — dosya yazılmadı)')
  process.exit(0)
}

const yaz = async (yol, veri) => {
  const tam = join(CIKTI, yol)
  await mkdir(dirname(tam), { recursive: true })
  await writeFile(tam, JSON.stringify(veri), 'utf8')
}

for (const d of dersler) {
  await yaz(`sorular/${d.id}.json`, sorular.filter((s) => s.dersId === d.id))
  await yaz(`kartlar/${d.id}.json`, kartlar.filter((k) => k.dersId === d.id))
}
await yaz('konular.json', konular)
await yaz('index.json', index)

console.log(`\n✓ Yazıldı → ${CIKTI}`)
console.log('  Not: denemeler.json, bilgiler.json ve oyunlar/* dosyaları korunur;')
console.log('       denemeleri de aktarmak isterseniz kaynak formatını paylaşın.')
