#!/usr/bin/env node
/**
 * Aciklamalardaki SIK HARFI atiflarini ("A sikki dogrudur") sikkin KENDI
 * METNIYLE degistirir ("'Ekvator cevresi...' secenegi dogrudur").
 *
 * NEDEN: Siklar, aciklamalar yazildiktan sonra yeniden siralanmis. Bu yuzden
 * aciklamalardaki harfler bir kisim soruda kaymis durumda; ustelik "siklari
 * karistir" ayari acikken harfler zaten anlamsiz hale geliyor. Harfi metne
 * cevirmek her iki sorunu da kokunden cozer.
 *
 * GUVENLIK: Harfler her soruda guvenilir DEGIL. Bu yuzden donusum yalnizca
 * aciklamanin "dogru cevap" dedigi harf ile bankadaki anahtarin AYNI oldugu
 * sorularda yapilir. Celisenler (harf kaymis olanlar) dokunulmadan birakilir
 * ve ayri bir listeye yazilir; onlarin aciklamasi yeniden yazilmalidir.
 *
 *   node tools/soru-araclari/denetim/harf-atiflari.mjs          (deneme)
 *   node tools/soru-araclari/denetim/harf-atiflari.mjs yaz      (uygular)
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const KOK = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const SORULAR = join(KOK, 'public/data/sorular')
const H = 'ABCDE'
const YAZ = process.argv[2] === 'yaz'
const AZAMI = 90 // sik metni bundan uzunsa kelime sinirindan kisaltilir

const kisalt = (s) => {
  const t = String(s).trim().replace(/\s+/g, ' ')
  if (t.length <= AZAMI) return t
  const kes = t.slice(0, AZAMI)
  const bosluk = kes.lastIndexOf(' ')
  return (bosluk > AZAMI * 0.6 ? kes.slice(0, bosluk) : kes).replace(/[\s,;:.]+$/, '') + '…'
}
/* Sik metinlerinde kesme isareti (Dunya'nin) sik gectigi icin tek tirnak
   yerine cift tirnak kullaniliyor; yoksa tirnak icinde tirnak karisiyor. */
const tirnakli = (s) => `“${kisalt(s)}”`

/* Aciklamanin "dogru cevap su harf" dedigi harfler */
const DOGRU_IDDIA = [
  /((?:[Dd]oğru\s+)?(?:[Cc]evap|[Yy]anıt)\s*:?\s*)([A-E])(?=[)'’.,;!]|\s*$)/gu,
  /(?<![\p{L}\p{N}])([A-E])(?=\s+(?:şık|şikk|seçene)\p{L}*\s+(?:doğru|geçerli|uygun))/gu,
  /(?<![\p{L}\p{N}])([A-E])(?=\s+doğru(?:dur)?(?![\p{L}]))/gu,
  /(?<![\p{L}\p{N}])([A-E])(?=\s+(?:şık|şikk|seçene)\p{L}*(?:d[iı]r|t[iı]r)(?![\p{L}]))/gu,
]

function iddiaEdilenler(a, sikSayisi) {
  const s = new Set()
  for (const r of DOGRU_IDDIA) {
    r.lastIndex = 0
    let m
    while ((m = r.exec(a)) !== null) {
      const h = m[2] || m[1]
      if (H.indexOf(h) < sikSayisi) s.add(h)
    }
  }
  return s
}

function donustur(a, secenekler) {
  const metin = (h) => {
    const i = H.indexOf(h)
    return i >= 0 && i < secenekler.length ? tirnakli(secenekler[i]) : null
  }
  return (
    String(a)
      /* "Doğru cevap D) Lodos şeklindedir." -> harf ve parantez atilir */
      .replace(
        /((?:[Dd]oğru\s+)?(?:[Cc]evap|[Yy]anıt)\s*:?\s*)([A-E])\)\s*/gu,
        (m, onek, h) => (metin(h) ? onek : m)
      )
      /* "Cevap C'dir." / "Doğru cevap A." -> "Doğru cevap '...' seçeneğidir." */
      .replace(
        /((?:[Dd]oğru\s+)?(?:[Cc]evap|[Yy]anıt))(\s*:?\s*)([A-E])(['’]\p{L}*)?(?=[.,;!]|\s*$)/gu,
        (m, bas, ara, h, ek) => (metin(h) ? `${bas}${ara}${metin(h)} seçeneğidir` : m)
      )
      /* "B seçeneğindeki" / "A şıkkı" -> "'...' seçeneğindeki" */
      .replace(
        /(?<![\p{L}\p{N}])([A-E](?:\s*,\s*[A-E])*(?:\s*(?:ve|ile|veya)\s*[A-E])?)(?=\s+(?:şık|şikk|seçene))/gu,
        (m) => (m.match(/[A-E]/g).every((h) => metin(h)) ? m.replace(/[A-E]/g, (h) => metin(h)) : m)
      )
      /* "A doğrudur" / "B yanlış:" -> "'...' seçeneği doğrudur" */
      .replace(
        /(?<![\p{L}\p{N}])([A-E])(?=\s+(?:doğru|yanlış|hatalı)(?:dur|tur|tır|dır)?(?![\p{L}]))/gu,
        (m, h) => (metin(h) ? `${metin(h)} seçeneği` : m)
      )
      .replace(/\s{2,}/g, ' ')
      .trim()
  )
}

const ATIF = /(?<![\p{L}\p{N}])([A-E])(?=\s*[),]|\s+(?:şık|şikk|seçene|doğru|yanlış|hatalı))/gu

let toplam = 0,
  atifli = 0,
  donusen = 0,
  celisen = 0,
  dogrulanamaz = 0,
  kalan = 0
const celisenListe = []
const ornekler = []

for (const f of readdirSync(SORULAR)) {
  if (!f.endsWith('.json')) continue
  const yol = join(SORULAR, f)
  const d = JSON.parse(readFileSync(yol, 'utf8'))
  let degisti = false
  for (const q of d) {
    toplam++
    const a = String(q.aciklama || '')
    if (!a) continue
    ATIF.lastIndex = 0
    if (!ATIF.test(a)) continue
    atifli++
    const anah = H[q.dogru]
    const iddia = iddiaEdilenler(a, q.secenekler.length)
    const uyusmaz = [...iddia].filter((h) => h !== anah)
    if (uyusmaz.length) {
      celisen++
      celisenListe.push({ ders: f.slice(0, -5), id: String(q.id), anahtar: anah, iddia: uyusmaz })
      continue
    }
    /* Aciklama hangi harfin dogru oldugunu hic soylemiyorsa harflerin
       kaymis olup olmadigini DOGRULAYAMAYIZ; dokunmuyoruz. */
    if (iddia.size === 0) {
      dogrulanamaz++
      celisenListe.push({ ders: f.slice(0, -5), id: String(q.id), anahtar: anah, iddia: [], neden: 'dogrulanamadi' })
      continue
    }
    const yeni = donustur(a, q.secenekler)
    if (yeni !== a) {
      if (ornekler.length < 6) ornekler.push([f.slice(0, -5), q.id, a, yeni])
      q.aciklama = yeni
      donusen++
      degisti = true
    }
    ATIF.lastIndex = 0
    if (ATIF.test(q.aciklama)) kalan++
  }
  if (degisti && YAZ) writeFileSync(yol, JSON.stringify(d, null, 1), 'utf8')
}

console.log(`soru: ${toplam}`)
console.log(`  aciklamasinda harf atifi olan : ${atifli}`)
console.log(`  harfi metne cevrilen          : ${donusen}`)
console.log(`  celisen (harf kaymis, atlandi): ${celisen}`)
console.log(`  dogrulanamadi (atlandi)       : ${dogrulanamaz}`)
console.log(`  cevrilmeden kalan atif        : ${kalan}`)
if (YAZ) {
  writeFileSync(join(dirname(fileURLToPath(import.meta.url)), 'harf-celisenler.json'),
    JSON.stringify(celisenListe, null, 1), 'utf8')
  console.log('\nyazildi. celisen liste: harf-celisenler.json')
} else {
  console.log('\n(deneme turu — hicbir dosya degismedi)')
}
for (const [ders, id, eski, yeni] of ornekler) {
  console.log(`\n--- ${ders} #${id}\n  ESKI: ${eski.slice(0, 260)}\n  YENI: ${yeni.slice(0, 300)}`)
}
