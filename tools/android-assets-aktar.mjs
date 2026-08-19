#!/usr/bin/env node
/**
 * Android assets → web veri formatı (KESİN ŞEMA).
 *
 * Bu betik tahmin yürütmez; Android'deki IcerikYukleyici.kt'nin okuduğu şemayı
 * birebir bilir:
 *   sorular/<ders>.json → [{ id, konuId, metin, secenekler[], dogruCevap, aciklama, zorluk }]
 *   kartlar/<ders>.json → [{ id, on, arka, konuId, etiketler[] }]
 *   notlar/<ders>.json  → [{ konuId, baslik, ozet, bolumler:[{ baslik, icerik }] }]
 *
 * Kullanım: node tools/android-assets-aktar.mjs <assets-klasoru> [--duzelt]
 *   --duzelt : bilinen içerik hatalarını aktarım sırasında düzeltir (aşağıya bak)
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..')
const HEDEF = join(KOK, 'public', 'data')
const kaynak = process.argv[2]
const DUZELT = process.argv.includes('--duzelt')

if (!kaynak) {
  console.error('Kullanım: node tools/android-assets-aktar.mjs <assets-klasoru> [--duzelt]')
  process.exit(1)
}

/* ── Bilinen içerik düzeltmeleri ───────────────────────────────
   Denetimde tespit edilen, kaynakta da düzeltilmesi gereken hatalar.
   Her biri DUZELTMELER.md dosyasında gerekçesiyle listelenir. */
const DUZELTMELER = {
  // Şık metni "F) ..." biçiminde sızmış üretim artığı — şık listeden çıkarılır
  200548: { sikSil: 0 },
  50171: { sikSil: 3 },
  34648: { sikSil: 0 },
  // "maddi olmayan duran varlık" sorusunda cevap anahtarı yanlış:
  // "Arazi ve arsalar" MADDİ duran varlıktır; doğru cevap "Patentler".
  // Ayrıca E şıkkı yalnızca "C" yazan boş bir artık.
  50293: { sikSil: 4, dogruMetin: 'Patentler' },
  // 2017 Anayasa değişikliği sonrası güncelliğini yitirmiş cevap:
  // "yalnızca vatana ihanet" kuralı kaldırıldı; her suç için soruşturma
  // açılabiliyor ve yargılama Yüce Divan (Anayasa Mahkemesi) sıfatıyla yapılıyor.
  34353: {
    dogruMetin: 'Anayasa Mahkemesi tarafından yargılanır',
    aciklama:
      '2017 Anayasa değişikliğiyle Cumhurbaşkanının cezai sorumluluğu genişletildi. Artık yalnızca vatana ihanet değil, herhangi bir suç iddiasıyla TBMM üye tam sayısının salt çoğunluğunun önergesiyle soruşturma açılması istenebilir; beşte üç çoğunlukla soruşturma açılır, üçte iki çoğunlukla Yüce Divan’a sevk edilir. Yargılamayı Anayasa Mahkemesi Yüce Divan sıfatıyla yapar.',
  },
}

const oku = async (p) => JSON.parse(await readFile(join(kaynak, p), 'utf8'))
const yaz = async (yol, veri) => {
  const tam = join(HEDEF, yol)
  await mkdir(dirname(tam), { recursive: true })
  await writeFile(tam, JSON.stringify(veri), 'utf8')
}

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

const dersler = (await readdir(join(kaynak, 'sorular'))).map((f) => f.replace('.json', '')).sort()
console.log(`• ${dersler.length} ders bulundu`)

const rapor = { soru: 0, kart: 0, not: 0, atlanan: [], duzeltilen: [] }
const konuAdlari = new Map() // konuId -> ad (Models.kt'den gelen adlar korunur)

// Mevcut konular.json'daki adları koru (android-veri-cikar.mjs üretmiş olabilir)
const mevcutKonular = await readFile(join(HEDEF, 'konular.json'), 'utf8')
  .then(JSON.parse)
  .catch(() => [])
for (const k of mevcutKonular) konuAdlari.set(k.id, k)

const dersOzet = []

for (const ders of dersler) {
  /* --- Sorular --- */
  const ham = await oku(`sorular/${ders}.json`)
  const sorular = []
  for (const s of ham) {
    let secenekler = (s.secenekler || []).map(String)
    let dogru = s.dogruCevap
    const d = DUZELTMELER[s.id]

    if (d && DUZELT) {
      if (d.sikSil != null) {
        const silinen = secenekler[d.sikSil]
        secenekler = secenekler.filter((_, i) => i !== d.sikSil)
        if (dogru > d.sikSil) dogru -= 1
        else if (dogru === d.sikSil) dogru = 0 // güvenlik; aşağıda dogruMetin varsa düzelir
        rapor.duzeltilen.push(`${ders}:${s.id} — artık şık silindi ("${String(silinen).slice(0, 40)}…")`)
      }
      if (d.dogruMetin) {
        const ix = secenekler.findIndex((x) => x.trim() === d.dogruMetin)
        if (ix >= 0) {
          dogru = ix
          rapor.duzeltilen.push(`${ders}:${s.id} — doğru cevap "${d.dogruMetin}" olarak düzeltildi`)
        }
      }
    }

    // Geçerlilik kontrolü — bozuk kayıt aktarılmaz
    if (!s.metin?.trim() || secenekler.length < 4 || dogru == null || dogru < 0 || dogru >= secenekler.length) {
      rapor.atlanan.push(`${ders}:${s.id}`)
      continue
    }

    sorular.push({
      id: String(s.id),
      dersId: ders,
      konuId: s.konuId,
      soru: s.metin,
      secenekler,
      dogru,
      ...(d && DUZELT && d.aciklama ? { aciklama: d.aciklama } : s.aciklama ? { aciklama: s.aciklama } : {}),
      /* Zorluk HER ZAMAN yazılır. Eskiden yer kazanmak için 'orta' olanlar
         atlanıyordu; sonuçta 5.575 soruda alan hiç yoktu ve Android'deki
         zorluk filtresi web'e taşınırsa sessizce yanlış çalışırdı.
         Maliyeti yaklaşık %1 dosya boyutu — saklamaya değmeyecek kadar az. */
      ...(s.zorluk ? { zorluk: s.zorluk } : {}),
    })
  }
  await yaz(`sorular/${ders}.json`, sorular)
  rapor.soru += sorular.length

  /* --- Kartlar --- */
  let kartlar = []
  try {
    kartlar = (await oku(`kartlar/${ders}.json`)).map((k) => ({
      id: String(k.id),
      dersId: ders,
      konuId: k.konuId || '',
      on: String(k.on),
      arka: String(k.arka) + (k.etiketler?.length ? ' ' + k.etiketler.map((e) => '#' + String(e).replace(/\s+/g, '')).join(' ') : ''),
    }))
  } catch {}
  await yaz(`kartlar/${ders}.json`, kartlar)
  rapor.kart += kartlar.length

  /* --- Konu anlatımları --- */
  let notlar = []
  try {
    notlar = (await oku(`notlar/${ders}.json`)).map((n) => ({
      konuId: n.konuId,
      dersId: ders,
      baslik: n.baslik,
      ozet: n.ozet || '',
      bolumler: (n.bolumler || []).map((b) => ({ baslik: b.baslik, icerik: b.icerik })),
      /* Püf noktaları ilk aktarımda düşmüştü — 670 madde. Sınav odaklı,
         kısa hatırlatmalar; hem uygulamada hem SEO sayfalarında değerli. */
      ...(n.puf_noktalar?.length ? { pufNoktalar: n.puf_noktalar } : {}),
    }))
  } catch {}
  if (notlar.length) await yaz(`notlar/${ders}.json`, notlar)
  rapor.not += notlar.length

  dersOzet.push({
    id: ders,
    ...(DERS_META[ders] || { ad: ders, grup: 'gk', ikon: 'tarih', renk: '#667492', renkKoyu: '#898781' }),
    soruSayisi: sorular.length,
    kartSayisi: kartlar.length,
    notSayisi: notlar.length,
    konuSayisi: new Set(sorular.map((s) => s.konuId)).size,
  })

  console.log(
    `  ${ders.padEnd(22)} ${String(sorular.length).padStart(5)} soru · ${String(kartlar.length).padStart(3)} kart · ${String(notlar.length).padStart(2)} konu anlatımı`
  )
}

/* --- konular.json: soru dosyalarındaki konuId'ler + Models.kt adları --- */
const konuSet = new Map()
for (const ders of dersler) {
  for (const s of JSON.parse(await readFile(join(HEDEF, `sorular/${ders}.json`), 'utf8'))) {
    if (!konuSet.has(s.konuId)) {
      const mevcut = konuAdlari.get(s.konuId)
      konuSet.set(s.konuId, {
        id: s.konuId,
        dersId: ders,
        ad: mevcut?.ad || s.konuId.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()),
        sira: mevcut?.sira ?? konuSet.size + 1,
      })
    }
  }
}
const konular = [...konuSet.values()].sort((a, b) => (a.sira || 0) - (b.sira || 0))
await yaz('konular.json', konular)

await yaz('index.json', {
  surum: 2,
  guncelleme: new Date().toISOString().slice(0, 10),
  kaynak: 'android-assets',
  dersler: dersOzet,
  istatistik: {
    sorular: rapor.soru,
    kartlar: rapor.kart,
    konular: konular.length,
    notlar: rapor.not,
    denemeler: 0,
  },
})

console.log(`\n✓ ${rapor.soru} soru · ${rapor.kart} kart · ${rapor.not} konu anlatımı · ${konular.length} konu`)
if (rapor.duzeltilen.length) {
  console.log(`\n${rapor.duzeltilen.length} düzeltme uygulandı:`)
  rapor.duzeltilen.forEach((x) => console.log('  · ' + x))
}
if (rapor.atlanan.length) console.log(`\n${rapor.atlanan.length} bozuk kayıt atlandı: ${rapor.atlanan.join(', ')}`)
if (!DUZELT) console.log('\n(Bilinen içerik hatalarını da düzeltmek için --duzelt ekleyin)')
