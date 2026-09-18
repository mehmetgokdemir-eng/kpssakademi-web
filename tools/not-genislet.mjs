#!/usr/bin/env node
/**
 * Ders notlarını genişletir.
 *
 * tools/notlar/<ders>-ek.json içindeki yeni bölüm ve püf noktalarını
 * public/data/notlar/<ders>.json dosyasına EKLER. Mevcut içeriğe dokunmaz;
 * yalnızca sona ekleme yapar.
 *
 * Tekrar çalıştırmak güvenlidir: aynı başlıklı bölüm veya aynı püf noktası
 * zaten varsa atlanır (idempotent). Böylece kısmi çalıştırma ya da yeniden
 * çalıştırma içeriği çoğaltmaz.
 *
 * Kullanım:  node tools/not-genislet.mjs [ders...]
 *            node tools/not-genislet.mjs --kontrol   (yazmadan rapor)
 */

import { readFile, writeFile, readdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..')
const EK_KLASOR = join(KOK, 'tools/notlar')
const NOT_KLASOR = join(KOK, 'public/data/notlar')

const argv = process.argv.slice(2)
const kontrol = argv.includes('--kontrol')
const istenen = argv.filter((a) => !a.startsWith('--'))

const kelime = (s) => String(s || '').split(/\s+/).filter(Boolean).length

let dosyalar
try {
  dosyalar = (await readdir(EK_KLASOR)).filter((f) => f.endsWith('-ek.json'))
} catch {
  console.error('tools/notlar/ klasörü yok — genişletilecek içerik bulunamadı.')
  process.exit(1)
}
if (istenen.length) dosyalar = dosyalar.filter((f) => istenen.includes(f.replace('-ek.json', '')))

let toplamBolum = 0
let toplamPuf = 0
let toplamKelime = 0

for (const dosya of dosyalar) {
  const ders = dosya.replace('-ek.json', '')
  const ek = JSON.parse(await readFile(join(EK_KLASOR, dosya), 'utf8'))
  const yol = join(NOT_KLASOR, `${ders}.json`)
  let notlar
  try {
    notlar = JSON.parse(await readFile(yol, 'utf8'))
  } catch {
    console.error(`  ! ${ders}: public/data/notlar/${ders}.json okunamadı, atlandı`)
    continue
  }

  let bol = 0
  let puf = 0
  let kel = 0
  const bulunmayan = []

  for (const [konuId, veri] of Object.entries(ek)) {
    const not = notlar.find((n) => n.konuId === konuId)
    if (!not) {
      bulunmayan.push(konuId)
      continue
    }
    not.bolumler ||= []
    not.pufNoktalar ||= []
    const mevcutBaslik = new Set(not.bolumler.map((b) => b.baslik))
    for (const b of veri.bolumler || []) {
      if (mevcutBaslik.has(b.baslik)) continue
      not.bolumler.push(b)
      bol++
      kel += kelime(b.icerik)
    }
    const mevcutPuf = new Set(not.pufNoktalar)
    for (const p of veri.puf || []) {
      if (mevcutPuf.has(p)) continue
      not.pufNoktalar.push(p)
      puf++
    }
  }

  if (bulunmayan.length) console.error(`  ! ${ders}: karşılığı olmayan konuId → ${bulunmayan.join(', ')}`)
  if (!kontrol) await writeFile(yol, JSON.stringify(notlar, null, 1), 'utf8')

  const ortalama = Math.round(
    notlar.reduce((t, n) => t + kelime(n.ozet) + (n.bolumler || []).reduce((a, b) => a + kelime(b.icerik), 0), 0) /
      notlar.length
  )
  console.log(`  ${kontrol ? '~' : '✓'} ${ders.padEnd(22)} +${String(bol).padStart(2)} bölüm  +${String(puf).padStart(2)} püf  +${String(kel).padStart(4)} kelime  → ort ${ortalama} kelime/konu`)
  toplamBolum += bol
  toplamPuf += puf
  toplamKelime += kel
}

console.log(`\n${kontrol ? 'KONTROL (yazılmadı)' : 'TAMAM'} — ${toplamBolum} bölüm, ${toplamPuf} püf, ${toplamKelime} kelime eklendi.`)
