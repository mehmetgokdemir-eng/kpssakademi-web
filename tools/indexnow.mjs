/* IndexNow — değişen adresleri Bing / Yandex / Naver / Seznam'a anında bildirir.
 *
 * Neden bu var: Bing Webmaster Tools'taki "URL Gönder" aracının günlük kotası
 * var ve elle yapılıyor. IndexNow aynı işi kotasız ve tek HTTP isteğiyle yapar;
 * doğrulama, sitenin kökündeki anahtar dosyasının okunabilmesiyle oluyor.
 *   https://kpssakademi.tr/<ANAHTAR>.txt  ->  içeriği yalnızca <ANAHTAR>
 * Google IndexNow kullanmıyor; orası ayrı (Search Console + sitemap).
 *
 * Kullanım:
 *   npm run indexnow             -> dist/sitemap.xml içindeki TÜM adresler
 *   npm run indexnow -- /kpss-ne-zaman /kpss-net-hesaplama   -> sadece bunlar
 *   npm run indexnow -- --deneme -> hiçbir şey göndermez, ne gideceğini yazar
 *
 * DİKKAT: anahtar dosyası public/ içinde durmalı ve YAYINDA olmalı. Dosya
 * canlıda 404 dönerse IndexNow isteği 403 ile reddedilir — betik bunu
 * göndermeden önce kontrol ediyor. */

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const KOK = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const ALAN = 'kpssakademi.tr'
const TABAN = `https://${ALAN}`
const UC = 'https://api.indexnow.org/IndexNow'
/* IndexNow tek istekte en fazla 10.000 adres kabul ediyor. */
const OBEK = 10000

/* Anahtarı public/ içindeki <64 karakterlik hex>.txt dosyasından okuyoruz ki
   anahtar iki yerde yazılı olup birbirinden ayrı düşmesin. */
function anahtarBul() {
  const dosyalar = readdirSync(resolve(KOK, 'public')).filter((d) => /^[a-f0-9]{8,128}\.txt$/i.test(d))
  if (dosyalar.length !== 1) {
    throw new Error(
      `public/ içinde tam olarak bir IndexNow anahtar dosyası olmalı, ${dosyalar.length} bulundu: ${dosyalar.join(', ') || '(yok)'}`,
    )
  }
  const ad = dosyalar[0]
  const anahtar = ad.replace(/\.txt$/i, '')
  const icerik = readFileSync(resolve(KOK, 'public', ad), 'utf8').trim()
  if (icerik !== anahtar) {
    throw new Error(`public/${ad} dosyasının içeriği anahtarla aynı olmalı. İçerik: "${icerik}"`)
  }
  return anahtar
}

function sitemaptenAdresler() {
  const yol = resolve(KOK, 'dist', 'sitemap.xml')
  if (!existsSync(yol)) throw new Error('dist/sitemap.xml yok — önce "npm run build" çalıştır.')
  return [...readFileSync(yol, 'utf8').matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1])
}

function normalle(x) {
  if (/^https?:\/\//i.test(x)) return x
  return TABAN + (x.startsWith('/') ? x : '/' + x)
}

const argv = process.argv.slice(2)
const deneme = argv.includes('--deneme') || argv.includes('--dry')
const elle = argv.filter((a) => !a.startsWith('--'))

const anahtar = anahtarBul()
const adresler = [...new Set((elle.length ? elle.map(normalle) : sitemaptenAdresler()))].filter((u) =>
  u.startsWith(TABAN),
)

if (!adresler.length) {
  console.error('Gönderilecek adres yok.')
  process.exit(1)
}

console.log(`Anahtar : ${anahtar}`)
console.log(`Kaynak  : ${elle.length ? 'komut satırı' : 'dist/sitemap.xml'}`)
console.log(`Adres   : ${adresler.length}`)

/* Canlıdaki anahtar dosyası erişilebilir mi? Değilse istek 403 döner ve
   sebebini anlamak zor olur; burada peşinen söylüyoruz. */
const anahtarUrl = `${TABAN}/${anahtar}.txt`
try {
  const y = await fetch(anahtarUrl)
  const g = (await y.text()).trim()
  if (!y.ok || g !== anahtar) {
    console.error(`\n✗ ${anahtarUrl} doğrulanamadı (HTTP ${y.status}, içerik "${g.slice(0, 40)}").`)
    console.error('  Anahtar dosyasını içeren sürümü Vercel\'e deploy ettikten sonra tekrar dene.')
    process.exit(1)
  }
  console.log(`Doğrulama: ${anahtarUrl} ✓`)
} catch (e) {
  console.error(`\n✗ Anahtar dosyasına ulaşılamadı: ${e.message}`)
  process.exit(1)
}

if (deneme) {
  console.log('\n--deneme: gönderilmedi. İlk 10 adres:')
  for (const u of adresler.slice(0, 10)) console.log('  ' + u)
  process.exit(0)
}

let gonderilen = 0
for (let i = 0; i < adresler.length; i += OBEK) {
  const obek = adresler.slice(i, i + OBEK)
  const y = await fetch(UC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: ALAN, key: anahtar, keyLocation: anahtarUrl, urlList: obek }),
  })
  /* 200 = alındı, 202 = alındı ama anahtar henüz doğrulanıyor. İkisi de iyi. */
  if (y.status === 200 || y.status === 202) {
    gonderilen += obek.length
    console.log(`✓ ${obek.length} adres gönderildi (HTTP ${y.status})`)
  } else {
    const g = await y.text().catch(() => '')
    console.error(`✗ HTTP ${y.status} ${y.statusText} ${g.slice(0, 200)}`)
    console.error(
      {
        400: '  Geçersiz istek — gövde biçimi bozuk.',
        403: '  Anahtar reddedildi — kök dizindeki .txt dosyasını kontrol et.',
        422: '  Adresler host ile uyuşmuyor ya da anahtar eşleşmiyor.',
        429: '  Çok fazla istek — bir süre bekle.',
      }[y.status] || '  Beklenmeyen yanıt.',
    )
    process.exit(1)
  }
}

console.log(`\nBitti — ${gonderilen} adres IndexNow'a bildirildi (Bing, Yandex, Naver, Seznam).`)
