#!/usr/bin/env node
/**
 * Arama motorları için STATİK HTML sayfaları üretir.
 *
 * Uygulama bir SPA olduğu için tarayıcıya tek bir boş index.html gider; arama
 * motorları JavaScript çalıştırsa da bu sayfaların içeriğini geç görür. Bu betik
 * her rehber sayfasını gerçek HTML olarak dist/ altına yazar. .htaccess "dosya
 * varsa doğrudan servis et" kuralına sahip olduğu için bu dosyalar SPA
 * yönlendirmesine takılmadan sunulur.
 *
 * `npm run build` sonrası otomatik çalışır (build:seo betiği).
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const KOK = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(KOK, 'dist')
const SITE = 'https://kpssakademi.tr'

const konular = JSON.parse(await readFile(join(KOK, 'public/data/konular.json'), 'utf8'))
const index = JSON.parse(await readFile(join(KOK, 'public/data/index.json'), 'utf8'))

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const GRUP_ADI = { gy: 'Genel Yetenek', gk: 'Genel Kültür', eb: 'Eğitim Bilimleri', ab: 'Alan Bilgisi' }

// Reklam birimi kimliği src/lib/reklam.js içindeki SLOTLAR.rehber ile aynı olmalı.
const ADSENSE_ID = 'ca-pub-6166144150941943'
const REHBER_SLOT = (await readFile(join(KOK, 'src/lib/reklam.js'), 'utf8').catch(() => ''))
  .match(/rehber:\s*'([^']*)'/)?.[1] || ''

// Slot tanımlı değilse hiç yazılmaz — sayfa reklamsız kalır, boşluk oluşmaz.
const REKLAM_ALANI = REHBER_SLOT
  ? `<div style="margin:22px 0">
<p style="text-align:center;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--soluk);margin:0 0 4px">Reklam</p>
<ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE_ID}" data-ad-slot="${REHBER_SLOT}" data-ad-format="auto" data-full-width-responsive="true"></ins>
<script>try{(adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}</script>
</div>`
  : ''

/* ── Ortak şablon ─────────────────────────────────────────── */
function sayfa({ yol, baslik, aciklama, h1, icerik, jsonLd, guncelleme }) {
  const url = `${SITE}${yol}`
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(baslik)}</title>
<meta name="description" content="${esc(aciklama)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(baslik)}">
<meta property="og:description" content="${esc(aciklama)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="article">
<meta property="og:image" content="${SITE}/icons/og.png">
<meta property="og:site_name" content="KPSS Akademi">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/svg+xml" href="/icons/icon.svg">
<link rel="manifest" href="/manifest.webmanifest">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
<meta name="google-adsense-account" content="${ADSENSE_ID}">
<script>
window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});
try{if(localStorage.getItem('ka:reklam-onayi')==='izin'){gtag('consent','update',{ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'})}}catch(e){}
</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_ID}" crossorigin="anonymous"></script>
<style>
:root{--mavi:#1f49f0;--metin:#1c2030;--soluk:#667492;--cizgi:#eceef2;--yuzey:#fff;--zemin:#f6f7f9}
@media(prefers-color-scheme:dark){:root{--metin:#eceef2;--soluk:#8593ac;--cizgi:#2a2f3d;--yuzey:#1c2030;--zemin:#12141f}}
*{box-sizing:border-box}
body{margin:0;background:var(--zemin);color:var(--metin);font:16px/1.65 Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.kap{max-width:820px;margin:0 auto;padding:0 20px 64px}
header{border-bottom:1px solid var(--cizgi);background:var(--yuzey)}
header .kap{display:flex;align-items:center;gap:12px;padding:14px 20px}
header img{width:34px;height:34px;border-radius:9px}
header b{font-size:15px}
nav{margin-left:auto;display:flex;gap:16px;flex-wrap:wrap}
nav a{color:var(--soluk);text-decoration:none;font-size:13px;font-weight:600}
nav a:hover{color:var(--mavi)}
h1{font-size:30px;line-height:1.25;margin:32px 0 8px;letter-spacing:-.02em}
h2{font-size:21px;margin:34px 0 10px;letter-spacing:-.01em}
h3{font-size:16px;margin:22px 0 6px}
p,li{color:var(--metin)}
.ozet{color:var(--soluk);font-size:17px;margin:0 0 4px}
table{border-collapse:collapse;width:100%;margin:14px 0;font-size:14px}
th,td{border:1px solid var(--cizgi);padding:9px 11px;text-align:left}
th{background:var(--yuzey);font-weight:700}
.kart{background:var(--yuzey);border:1px solid var(--cizgi);border-radius:14px;padding:16px 18px;margin:14px 0}
.cta{display:inline-block;background:var(--mavi);color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:12px;margin:8px 8px 8px 0}
.cta.ikincil{background:transparent;color:var(--mavi);border:1px solid var(--mavi)}
.konu-liste{columns:2;column-gap:26px;padding-left:20px;margin:6px 0}
.konu-liste li{break-inside:avoid;font-size:14px;color:var(--soluk)}
@media(max-width:560px){.konu-liste{columns:1}h1{font-size:25px}}
footer{border-top:1px solid var(--cizgi);margin-top:48px;padding:22px 0;color:var(--soluk);font-size:13px}
footer a{color:var(--soluk)}
.tarih{color:var(--soluk);font-size:13px}
</style>
</head>
<body>
<header><div class="kap">
  <img src="/icons/icon.svg" alt=""><b>KPSS Akademi</b>
  <nav>
    <a href="/">Uygulama</a>
    <a href="/kpss-nedir">KPSS Nedir</a>
    <a href="/kpss-konulari">Konular</a>
    <a href="/kpss-puan-hesaplama">Puan Hesaplama</a>
    <a href="/kpss-ne-zaman">Ne Zaman</a>
    <a href="/kpss-deneme-sinavi">Denemeler</a>
  </nav>
</div></header>
<main class="kap">
<h1>${esc(h1)}</h1>
<p class="ozet">${esc(aciklama)}</p>
${icerik}
${REKLAM_ALANI}
<div class="kart" style="text-align:center">
  <p style="margin:0 0 10px;font-weight:700">16.000+ soru, bilgi kartları, denemeler ve oyunlar — ücretsiz</p>
  <a class="cta" href="/">Uygulamayı Aç</a>
  <a class="cta ikincil" href="/denemeler">Deneme Çöz</a>
</div>
${guncelleme ? `<p class="tarih">Son güncelleme: ${guncelleme}</p>` : ''}
</main>
<footer><div class="kap">
  <a href="/hakkinda">Hakkında</a> · <a href="/gizlilik">Gizlilik</a> · <a href="/iletisim">İletişim</a> ·
  <a href="https://play.google.com/store/apps/details?id=com.nihangokdemir.kpss">Android uygulaması</a>
  · © ${new Date().getFullYear()} KPSS Akademi
</div></footer>
</body>
</html>`
}

/* ── Sayfa 1: KPSS Nedir ──────────────────────────────────── */
const sssNedir = [
  [
    'KPSS kaç soru ve kaç dakika sürer?',
    'Lisans düzeyinde Genel Yetenek–Genel Kültür oturumu 120 sorudan oluşur ve 130 dakika sürer. Genel Yetenek 60 soru (Türkçe 30, Matematik 30), Genel Kültür 60 sorudur (Tarih 27, Coğrafya 18, Vatandaşlık 9, Güncel Bilgiler 6).',
  ],
  [
    'KPSS’de yanlış cevap doğruyu götürür mü?',
    'Evet. Net sayısı “doğru − yanlış ÷ 4” formülüyle hesaplanır; yani 4 yanlış 1 doğruyu götürür. Emin olmadığın ama iki şıkka indirebildiğin sorularda işaretlemek genellikle avantajlıdır.',
  ],
  [
    'KPSS puanı kaç yıl geçerlidir?',
    'KPSS sonuçları açıklandığı tarihten itibaren iki yıl geçerlidir. Yeni sınava girildiğinde güncel puan geçerli olur.',
  ],
  [
    'Boş bırakmak mı yanlış yapmak mı daha iyi?',
    'Hiçbir fikrin yoksa boş bırakmak matematiksel olarak nötrdür. En az bir şıkkı kesin eleyebiliyorsan işaretlemenin beklenen değeri pozitife döner.',
  ],
]

const nedirIcerik = `
<p>KPSS (Kamu Personel Seçme Sınavı), kamu kurumlarında memur olarak çalışmak isteyen adayların girdiği,
ÖSYM tarafından yapılan merkezi bir sınavdır. Lisans, ön lisans ve ortaöğretim düzeylerinde ayrı ayrı
uygulanır; adaylar mezuniyet düzeyine uygun oturuma girer.</p>

<h2>Lisans düzeyinde sınav yapısı</h2>
<p>Genel Yetenek ve Genel Kültür testleri tek oturumda, toplam 120 soru olarak uygulanır.</p>
<table>
<thead><tr><th>Test</th><th>Ders</th><th>Soru sayısı</th></tr></thead>
<tbody>
<tr><td rowspan="2"><b>Genel Yetenek</b> (60)</td><td>Türkçe</td><td>30</td></tr>
<tr><td>Matematik</td><td>30</td></tr>
<tr><td rowspan="4"><b>Genel Kültür</b> (60)</td><td>Tarih</td><td>27</td></tr>
<tr><td>Coğrafya</td><td>18</td></tr>
<tr><td>Vatandaşlık</td><td>9</td></tr>
<tr><td>Güncel Bilgiler</td><td>6</td></tr>
</tbody>
</table>
<p>Öğretmen adayları ayrıca <b>Eğitim Bilimleri</b> (80 soru) oturumuna, alan öğretmenliği için de
<b>ÖABT</b> oturumuna girer. A Grubu kadrolar için Alan Bilgisi testleri (Hukuk, İktisat, Maliye,
Muhasebe, İşletme, Kamu Yönetimi, Uluslararası İlişkiler) uygulanır.</p>

<h2>Net ve puan nasıl hesaplanır?</h2>
<div class="kart">
<p style="margin:0"><b>Net = Doğru − (Yanlış ÷ 4)</b></p>
</div>
<p>Netler doğrudan puan değildir. ÖSYM her testin netini, o testin aday kitlesindeki ortalama ve standart
sapmasına göre <b>standart puana</b> çevirir; puan türüne göre ağırlıklandırıp KPSS puanını üretir.
Ayrıntı için <a href="/kpss-puan-hesaplama">KPSS puan hesaplama</a> sayfasına bakabilirsin.</p>

<h2>Puan türleri</h2>
<p>Lisans düzeyinde en çok kullanılan üç puan türü, Genel Yetenek ve Genel Kültür testlerine verilen
ağırlıkla birbirinden ayrılır:</p>
<table>
<thead><tr><th>Puan türü</th><th>Genel Yetenek</th><th>Genel Kültür</th><th>Düzey</th></tr></thead>
<tbody>
<tr><td>P1</td><td>%70</td><td>%30</td><td>Lisans</td></tr>
<tr><td>P2</td><td>%60</td><td>%40</td><td>Lisans</td></tr>
<tr><td>P3</td><td>%50</td><td>%50</td><td>Lisans</td></tr>
<tr><td>P93</td><td>%50</td><td>%50</td><td>Ön lisans</td></tr>
<tr><td>P94</td><td>%50</td><td>%50</td><td>Ortaöğretim</td></tr>
</tbody>
</table>
<p>Öğretmenlik için P10 (Genel Yetenek, Genel Kültür ve Eğitim Bilimleri) ve ÖABT'yi de kapsayan P121
kullanılır. Puan türleri ve ağırlıkları zaman zaman değişebildiği için başvuru öncesi güncel ÖSYM
kılavuzunu kontrol etmek gerekir.</p>

<h2>Sık sorulan sorular</h2>
${sssNedir.map(([s, c]) => `<h3>${esc(s)}</h3><p>${esc(c)}</p>`).join('\n')}
`

/* ── Konu anlatımı verisi ─────────────────────────────────────
   Hem /kpss-konulari listesindeki bağlantılar hem de tek tek anlatım
   sayfaları bu haritalardan üretilir; notlar dosyaları bir kez okunur.

   DİKKAT: Türkçe harfler toLowerCase()'DEN ÖNCE çevrilmeli.
   'İ'.toLowerCase() → 'i' + U+0307 (birleşik nokta) üretir; sonradan yapılan
   replace('İ','i') eşleşecek karakter bulamaz ve nokta '-' olur:
   "İlk Türk Devletleri" → "i-lk-turk-devletleri" gibi bozuk adresler çıkar. */
const TR_HARF = { İ: 'i', I: 'i', Ş: 's', Ğ: 'g', Ü: 'u', Ö: 'o', Ç: 'c', ı: 'i', ş: 's', ğ: 'g', ü: 'u', ö: 'o', ç: 'c' }
const slug = (x) =>
  String(x)
    .replace(/[İIŞĞÜÖÇışğüöç]/g, (c) => TR_HARF[c] || c)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const notlarByDers = new Map()
/* Anahtar "dersId:konuId" — konuId'ler dersler arasında tekil DEĞİL
   (ör. uluslararasi_orgutler hem vatandaslik hem uluslararasi-iliskiler'de var). */
const anlatimYolu = new Map()
for (const d of index.dersler) {
  let notlar = []
  try {
    notlar = JSON.parse(await readFile(join(KOK, `public/data/notlar/${d.id}.json`), 'utf8'))
  } catch {
    continue
  }
  notlarByDers.set(d.id, notlar)
  for (const n of notlar) {
    if (n.konuId) anlatimYolu.set(`${d.id}:${n.konuId}`, `/konu/${slug(d.ad)}/${slug(n.baslik)}`)
  }
}

/* ── Sayfa 2: Konular ─────────────────────────────────────── */
/* Sınav sırasına göre: Genel Yetenek → Genel Kültür → Eğitim Bilimleri → Alan Bilgisi */
const GRUP_SIRA = ['gy', 'gk', 'eb', 'ab']
const gruplar = {}
for (const g of GRUP_SIRA) if (index.dersler.some((d) => d.grup === g)) gruplar[g] = []
for (const d of index.dersler) (gruplar[d.grup] ||= []).push(d)

const konularIcerik = `
<p>KPSS Akademi'deki soru bankası ${index.dersler.length} ders ve ${konular.length} konu başlığına ayrılmıştır.
Aşağıda her dersin konu listesini bulabilirsin; uygulamada her konuyu ayrı ayrı çalışabilir,
yanlışlarını biriktirip tekrar çözebilirsin.</p>
${Object.entries(gruplar)
  .map(
    ([g, dersler]) => `
<h2>${esc(GRUP_ADI[g] || g)}</h2>
${dersler
  .map((d) => {
    const kl = konular.filter((k) => k.dersId === d.id)
    if (!kl.length) return ''
    return `<h3><a href="/kpss-${slug(d.ad)}">${esc(d.ad)}</a> <span style="color:var(--soluk);font-weight:400;font-size:13px">· ${kl.length} konu</span></h3>
<ul class="konu-liste">${kl
      .map((k) => {
        const y = anlatimYolu.get(`${d.id}:${k.id}`)
        return `<li>${y ? `<a href="${y}">${esc(k.ad)}</a>` : esc(k.ad)}</li>`
      })
      .join('')}</ul>`
  })
  .join('\n')}`
  )
  .join('\n')}
`

/* ── Sayfa 3: Puan hesaplama ──────────────────────────────── */
const puanIcerik = `
<p>KPSS'de netin doğrudan puana çevrilmediğini bilmek, çalışma stratejini belirlerken en çok işe yarayan
bilgilerden biri. Bu sayfada hesabın nasıl işlediğini adım adım anlattık.</p>

<h2>1. Adım — Net hesabı</h2>
<div class="kart"><p style="margin:0"><b>Net = Doğru − (Yanlış ÷ 4)</b></p></div>
<p>Her test için ayrı ayrı hesaplanır. Örnek: Türkçe'de 22 doğru, 4 yanlış yapan bir aday
22 − 4/4 = <b>21 net</b> yapmıştır.</p>

<h2>2. Adım — Standart puan</h2>
<p>Ham net tek başına anlamlı değildir; 30 soruluk Matematik'te 15 net ile 30 soruluk Türkçe'de 15 net
aynı değeri taşımaz. ÖSYM her testin netini, o testin <b>aday kitlesindeki ortalamasına ve standart
sapmasına</b> göre ortalaması 50, standart sapması 10 olan bir ölçeğe taşır:</p>
<div class="kart"><p style="margin:0">Standart puan = 50 + 10 × (net − ortalama) ÷ standart sapma</p></div>
<p>Bu yüzden ortalaması düşük olan testlerde (tipik olarak Matematik) yapılan her net, adayı kitleden
daha fazla ayırır ve puana katkısı daha yüksek olur.</p>

<h2>3. Adım — Puan türüne göre ağırlıklandırma</h2>
<p>Testlerin standart puanları, hedeflenen puan türünün ağırlıklarıyla birleştirilir. Örneğin P3'te
Genel Yetenek ve Genel Kültür yarı yarıya etkilidir; P1'de Genel Yetenek'in ağırlığı %70'tir.</p>

<h2>Sık yapılan hata: “yüksek standart sapma = çok puan” değil</h2>
<p>Yaygın bir kanı, standart sapması yüksek derslerin her netinin daha çok kazandırdığıdır. Formüle
bakıldığında bir netin standart puana katkısı <b>10 ÷ standart sapma</b>'dır; yani sapma büyüdükçe
<i>bir netin marjinal katkısı azalır</i>. Matematiğin değerli olmasının sebebi sapmasının yüksekliği
değil, <b>ortalamasının düşük olmasıdır</b> — az kişinin çözdüğü bir testte 20 net yapmak, herkesin
çözdüğü bir testte 20 net yapmaktan çok daha fazla ayırt eder.</p>

<h2>Kendi puanını hesapla</h2>
<p>Uygulamadaki hesaplayıcı bu üç adımı otomatik uygular; ayrıca hedef puanına ulaşmak için hangi
dersten kaç net gerektiğini de gösterir.</p>
<p><a class="cta" href="/puan-hesapla">Puan Hesaplayıcıyı Aç</a></p>
<p class="tarih">Hesaplama, geçmiş yıl istatistiklerinden türetilmiş ortalama ve standart sapma
değerlerine dayanan bir tahmindir; ÖSYM'nin resmî sonucuyla birebir aynı olmayabilir.</p>
`

/* ── Üret ─────────────────────────────────────────────────── */
const bugun = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

const sayfalar = [
  {
    yol: '/kpss-nedir',
    baslik: 'KPSS Nedir? Sınav Yapısı, Soru Dağılımı ve Puan Türleri | KPSS Akademi',
    aciklama:
      'KPSS nedir, kaç soru sorulur, net ve puan nasıl hesaplanır, P1-P2-P3 puan türleri ne anlama gelir? Lisans düzeyi soru dağılımıyla birlikte sade bir özet.',
    h1: 'KPSS Nedir? Sınav Yapısı ve Puan Türleri',
    icerik: nedirIcerik,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: sssNedir.map(([s, c]) => ({
        '@type': 'Question',
        name: s,
        acceptedAnswer: { '@type': 'Answer', text: c },
      })),
    },
  },
  {
    yol: '/kpss-konulari',
    baslik: `KPSS Konuları — ${index.dersler.length} Ders, ${konular.length} Konu Listesi | KPSS Akademi`,
    aciklama: `KPSS Genel Yetenek, Genel Kültür, Eğitim Bilimleri ve Alan Bilgisi derslerinin tam konu listesi — ${konular.length} başlık.`,
    h1: 'KPSS Konuları — Tam Liste',
    icerik: konularIcerik,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'KPSS Konu Listesi',
      numberOfItems: konular.length,
      itemListElement: konular.slice(0, 100).map((k, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: k.ad,
      })),
    },
  },
  {
    yol: '/kpss-puan-hesaplama',
    baslik: 'KPSS Puan Hesaplama: Net, Standart Puan ve Ağırlıklar | KPSS Akademi',
    aciklama:
      'KPSS puanı nasıl hesaplanır? Net formülü, standart puana çevrim ve puan türü ağırlıkları adım adım. Ücretsiz puan hesaplayıcı.',
    h1: 'KPSS Puanı Nasıl Hesaplanır?',
    icerik: puanIcerik,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'KPSS puanı nasıl hesaplanır',
      step: [
        { '@type': 'HowToStep', name: 'Net hesapla', text: 'Her test için: Net = Doğru − (Yanlış ÷ 4)' },
        { '@type': 'HowToStep', name: 'Standart puana çevir', text: 'Standart puan = 50 + 10 × (net − ortalama) ÷ standart sapma' },
        { '@type': 'HowToStep', name: 'Ağırlıklandır', text: 'Test standart puanlarını puan türünün ağırlıklarıyla birleştir.' },
      ],
    },
  },
]

/* ── Konu anlatımı sayfaları (her konu için ayrı statik HTML) ── */
const anlatimSayfalari = []
for (const d of index.dersler) {
  const notlar = notlarByDers.get(d.id)
  if (!notlar) continue
  for (const n of notlar) {
    const yol = `/konu/${slug(d.ad)}/${slug(n.baslik)}`
    const govde = (n.bolumler || [])
      .map(
        (b) =>
          `<h2>${esc(b.baslik)}</h2><p style="white-space:pre-line">${esc(b.icerik)}</p>`
      )
      .join('\n')
    anlatimSayfalari.push({
      yol,
      baslik: `${n.baslik} — ${d.ad} Konu Anlatımı | KPSS Akademi`,
      aciklama: (n.ozet || `${d.ad} dersi ${n.baslik} konusunun KPSS'ye yönelik özeti.`).slice(0, 160),
      h1: `${n.baslik}`,
      icerik: `<p style="color:var(--soluk);font-size:14px;margin:-4px 0 18px">
  <a href="/kpss-konulari">KPSS Konuları</a> › ${esc(d.ad)}
</p>
${n.ozet ? `<div class="kart"><b>Özet</b><p style="margin:6px 0 0">${esc(n.ozet)}</p></div>` : ''}
${govde}
${
  n.pufNoktalar?.length
    ? `<h2>Püf Noktaları</h2><div class="kart"><ul style="margin:0;padding-left:18px">${n.pufNoktalar
        .map((x) => `<li style="margin:6px 0">${esc(x)}</li>`)
        .join('')}</ul></div>`
    : ''
}
<div class="kart" style="text-align:center">
  <p style="margin:0 0 10px;font-weight:700">Bu konudan soru çöz</p>
  <a class="cta" href="/ders/${d.id}/konu/${n.konuId}">Soruları Aç</a>
  <a class="cta ikincil" href="/ders/${d.id}/anlatim">${esc(d.ad)} Konuları</a>
</div>`,
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `${n.baslik} — ${d.ad} Konu Anlatımı`,
        about: n.baslik,
        inLanguage: 'tr',
        isPartOf: { '@type': 'WebSite', name: 'KPSS Akademi', url: SITE },
      },
    })
  }
}
sayfalar.push(...anlatimSayfalari)

/* ── Ders sayfaları ────────────────────────────────────────────
   "kpss tarih", "kpss matematik konuları" gibi aramalar konu sayfalarından
   daha yüksek hacimli; site bunlara karşılık verecek bir sayfa sunmuyordu.

   Adres /kpss-<ders> — /ders/<id> KULLANILAMAZ, çünkü o uygulamanın kendi
   rotası; oraya statik dosya koymak dosya-sistemi-önce kuralı yüzünden
   uygulamanın ders ekranını gölgeler.

   Hiyerarşi böylece tamamlanıyor:  /kpss-konulari → /kpss-<ders> → /konu/<ders>/<konu> */
const dersSayfalari = []
for (const d of index.dersler) {
  const dersKonulari = konular.filter((k) => k.dersId === d.id)
  const notlar = notlarByDers.get(d.id) || []
  const notHarita = new Map(notlar.map((n) => [n.konuId, n]))

  const konuSatirlari = dersKonulari
    .map((k) => {
      const yol = anlatimYolu.get(`${d.id}:${k.id}`)
      const n = notHarita.get(k.id)
      const ad = yol ? `<a href="${yol}">${esc(k.ad)}</a>` : esc(k.ad)
      return `<tr><td>${ad}</td><td>${n?.ozet ? esc(n.ozet.slice(0, 120)) : '—'}</td></tr>`
    })
    .join('')

  /* Püf noktalarından bir demet — sayfaya özgün, işe yarar metin katıyor. */
  const pufler = notlar.flatMap((n) => n.pufNoktalar || []).slice(0, 8)

  const grupAdi = GRUP_ADI[d.grup] || d.grup
  dersSayfalari.push({
    yol: `/kpss-${slug(d.ad)}`,
    baslik: `KPSS ${d.ad} — Konular, Soru Bankası ve Konu Anlatımı | KPSS Akademi`,
    aciklama: `KPSS ${d.ad} dersi: ${dersKonulari.length} konu, ${d.soruSayisi.toLocaleString('tr-TR')} çözümlü soru, ${d.kartSayisi} bilgi kartı ve konu anlatımları. Ücretsiz.`,
    h1: `KPSS ${d.ad}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `KPSS ${d.ad} Konuları`,
      numberOfItems: dersKonulari.length,
      itemListElement: dersKonulari.slice(0, 60).map((k, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: k.ad,
        ...(anlatimYolu.get(`${d.id}:${k.id}`) ? { url: SITE + anlatimYolu.get(`${d.id}:${k.id}`) } : {}),
      })),
    },
    icerik: `<p style="color:var(--soluk);font-size:14px;margin:-4px 0 18px">
  <a href="/kpss-konulari">KPSS Konuları</a> › ${esc(d.ad)}
</p>
<p><b>${esc(d.ad)}</b>, KPSS'de <b>${esc(grupAdi)}</b> bölümünde yer alır. KPSS Akademi'de bu ders
${dersKonulari.length} konu başlığına ayrılmıştır; her soru çözüm açıklamalıdır ve yanlışların otomatik
olarak tekrar listene eklenir.</p>

<div class="kart">
  <table style="margin:0">
    <tr><th>Soru</th><th>Bilgi kartı</th><th>Konu</th><th>Konu anlatımı</th></tr>
    <tr>
      <td><b>${d.soruSayisi.toLocaleString('tr-TR')}</b></td>
      <td><b>${d.kartSayisi}</b></td>
      <td><b>${dersKonulari.length}</b></td>
      <td><b>${notlar.length}</b></td>
    </tr>
  </table>
</div>

<h2>KPSS ${esc(d.ad)} konuları</h2>
<table>
  <tr><th style="width:34%">Konu</th><th>Özet</th></tr>
  ${konuSatirlari}
</table>

${
  pufler.length
    ? `<h2>${esc(d.ad)} için bilinmesi gerekenler</h2>
<div class="kart"><ul style="margin:0;padding-left:18px">${pufler
        .map((x) => `<li style="margin:6px 0">${esc(x)}</li>`)
        .join('')}</ul></div>`
    : ''
}

<h2>Nasıl çalışılır?</h2>
<p>Konu anlatımını okuyup hemen o konudan soru çözmek, önce tüm dersi bitirip sonra soruya geçmekten
daha hızlı sonuç verir. KPSS Akademi'de her konu anlatımının altında "Bu Konuyu Çöz" bağlantısı bulunur;
yanlış yaptığın sorular <b>Yanlışlarım</b> listesine ve aralıklı tekrar kuyruğuna düşer.</p>

<div class="kart" style="text-align:center">
  <p style="margin:0 0 10px;font-weight:700">${esc(d.ad)} sorularını çözmeye başla</p>
  <a class="cta" href="/ders/${d.id}">${esc(d.ad)} Soruları</a>
  <a class="cta ikincil" href="/ders/${d.id}/anlatim">Konu Anlatımları</a>
</div>`,
  })
}
sayfalar.push(...dersSayfalari)

/* ── Uzun kuyruk rehber sayfaları ──────────────────────────────
   "kpss" tek kelimesinde yarışmak anlamsız (osym.gov.tr, memurlar.net,
   haber siteleri). Buradaki sayfalar NİYET belirten aramaları hedefliyor:
   "kpss ne zaman", "kpss net hesaplama", "kpss soru dağılımı" gibi.
   Hacim daha düşük ama rekabet ve dönüşüm çok daha iyi.

   Tarihler ÖSYM 2026 sınav takviminden; her sayfada osym.gov.tr uyarısı var. */

const SINAV_TAKVIMI = [
  ['KPSS Lisans — Genel Yetenek / Genel Kültür', '6 Eylül 2026'],
  ['KPSS Lisans — Alan Bilgisi 1. gün', '12 Eylül 2026'],
  ['KPSS Lisans — Alan Bilgisi 2. gün', '13 Eylül 2026'],
  ['KPSS Ön Lisans', '4 Ekim 2026'],
  ['KPSS Ortaöğretim (Lise)', '25 Ekim 2026'],
  ['DHBT', '1 Kasım 2026'],
]

const GYGK_DAGILIM = [
  ['Türkçe', 30, 'Genel Yetenek'],
  ['Matematik', 30, 'Genel Yetenek'],
  ['Tarih', 27, 'Genel Kültür'],
  ['Coğrafya', 18, 'Genel Kültür'],
  ['Vatandaşlık', 9, 'Genel Kültür'],
  ['Güncel Bilgiler', 6, 'Genel Kültür'],
]

const sss = (liste) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: liste.map(([soru, cevap]) => ({
    '@type': 'Question',
    name: soru,
    acceptedAnswer: { '@type': 'Answer', text: cevap },
  })),
})

const uyari = `<p class="tarih">Sınav tarihleri ve kılavuzlar için esas kaynak <b>osym.gov.tr</b>'dir. KPSS Akademi bağımsız bir çalışma aracıdır; ÖSYM ile resmî bir bağlantısı yoktur.</p>`

const uzunKuyruk = [
  {
    yol: '/kpss-ne-zaman',
    baslik: 'KPSS Ne Zaman? 2026 Sınav Tarihleri | KPSS Akademi',
    aciklama: 'KPSS 2026 sınav takvimi: Lisans 6 Eylül, Alan Bilgisi 12-13 Eylül, Ön Lisans 4 Ekim, Ortaöğretim 25 Ekim, DHBT 1 Kasım 2026.',
    h1: 'KPSS Ne Zaman? 2026 Sınav Tarihleri',
    jsonLd: sss([
      ['KPSS Lisans ne zaman?', 'KPSS Lisans Genel Yetenek–Genel Kültür oturumu 6 Eylül 2026 tarihinde yapılacaktır. Alan Bilgisi oturumları 12 ve 13 Eylül 2026 tarihlerindedir.'],
      ['KPSS Ön Lisans ne zaman?', 'KPSS Ön Lisans sınavı 4 Ekim 2026 tarihinde yapılacaktır.'],
      ['KPSS Ortaöğretim ne zaman?', 'KPSS Ortaöğretim (Lise) sınavı 25 Ekim 2026 tarihinde yapılacaktır.'],
    ]),
    icerik: `<p>2026 KPSS oturumlarının tarihleri aşağıdadır. Sınav saatleri ve giriş belgesi bilgileri
sınavdan kısa süre önce ÖSYM tarafından duyurulur.</p>
<table>
  <tr><th>Oturum</th><th>Tarih</th></tr>
  ${SINAV_TAKVIMI.map(([a, t]) => `<tr><td>${esc(a)}</td><td><b>${esc(t)}</b></td></tr>`).join('')}
</table>
<h2>Sınava kaç gün kaldı?</h2>
<p>KPSS Akademi'nin ana sayfasında, seçtiğin sınav türüne göre canlı bir geri sayım bulunur.
Ayarlar'dan hangi oturuma hazırlandığını seçebilir, günlük soru hedefini buna göre belirleyebilirsin.</p>
<h2>Hangi oturuma girmelisin?</h2>
<ul>
  <li><b>Lisans</b> — 4 yıllık fakülte mezunları ve son sınıf öğrencileri.</li>
  <li><b>Ön Lisans</b> — 2 yıllık meslek yüksekokulu mezunları.</li>
  <li><b>Ortaöğretim</b> — lise ve dengi okul mezunları.</li>
</ul>
<p>Öğretmenlik için Eğitim Bilimleri, A grubu kadrolar için Alan Bilgisi oturumlarına ayrıca girilir.</p>
${uyari}`,
  },
  {
    yol: '/kpss-soru-dagilimi',
    baslik: 'KPSS Soru Dağılımı 2026 — Hangi Dersten Kaç Soru? | KPSS Akademi',
    aciklama: 'KPSS Genel Yetenek–Genel Kültür: 120 soru, 130 dakika. Türkçe 30, Matematik 30, Tarih 27, Coğrafya 18, Vatandaşlık 9, Güncel 6 soru.',
    h1: 'KPSS Soru Dağılımı',
    jsonLd: sss([
      ['KPSS kaç soru?', 'Genel Yetenek–Genel Kültür oturumu 120 sorudan oluşur ve 130 dakika sürer. Lisans, Ön Lisans ve Ortaöğretim düzeylerinin üçünde de soru sayısı ve ders dağılımı aynıdır.'],
      ['KPSS Tarih kaç soru?', 'Genel Kültür testinde Tarih 27 sorudur; toplam sınavın yaklaşık %22,5’ini oluşturur.'],
    ]),
    icerik: `<p>Genel Yetenek–Genel Kültür oturumu <b>120 soru</b> ve <b>130 dakikadır</b>. Soru başına ortalama
65 saniye düşer. Lisans, Ön Lisans ve Ortaöğretim düzeylerinin üçünde de ders dağılımı aynıdır;
fark soru sayısında değil, zorluk seviyesindedir.</p>
<table>
  <tr><th>Ders</th><th>Bölüm</th><th>Soru</th><th>Ağırlık</th></tr>
  ${GYGK_DAGILIM.map(([ad, n, grup]) => `<tr><td><a href="/kpss-${slug(ad)}">${esc(ad)}</a></td><td>${esc(grup)}</td><td><b>${n}</b></td><td>%${((n / 120) * 100).toFixed(1)}</td></tr>`).join('')}
  <tr><td colspan="2"><b>Toplam</b></td><td><b>120</b></td><td><b>%100</b></td></tr>
</table>
<h2>Diğer oturumlar</h2>
<ul>
  <li><b>Eğitim Bilimleri</b> — 80 soru, 100 dakika. Öğretmen adayları için.</li>
  <li><b>Alan Bilgisi (A grubu)</b> — Hukuk, İktisat, Maliye, Muhasebe, İşletme, Kamu Yönetimi ve
  Uluslararası İlişkiler testlerinden oluşur; iki güne yayılır.</li>
</ul>
<h2>Bu dağılım çalışma planını nasıl değiştirmeli?</h2>
<p>Türkçe ve Matematik birlikte sınavın yarısını oluşturur (60 soru). Genel Kültür tarafında ise
Tarih tek başına Coğrafya, Vatandaşlık ve Güncel Bilgiler'in toplamının yarısı kadardır. Zaman
ayırırken bu ağırlıkları gözetmek, her derse eşit süre vermekten daha verimlidir.</p>
${uyari}`,
  },
  {
    yol: '/kpss-net-hesaplama',
    baslik: 'KPSS Net Hesaplama — 4 Yanlış 1 Doğruyu Götürür | KPSS Akademi',
    aciklama: 'KPSS net hesaplama formülü: Net = Doğru − (Yanlış ÷ 4). Örneklerle net hesabı, boş bırakma stratejisi ve ücretsiz hesaplayıcı.',
    h1: 'KPSS Net Hesaplama',
    jsonLd: sss([
      ['KPSS net nasıl hesaplanır?', 'Net = Doğru − (Yanlış ÷ 4) formülüyle hesaplanır. Her test için ayrı ayrı yapılır; 4 yanlış 1 doğruyu götürür.'],
      ['KPSS’de boş bırakmak mı yanlış yapmak mı iyi?', 'Hiçbir fikrin yoksa boş bırakmak matematiksel olarak nötrdür. En az bir şıkkı kesin eleyebiliyorsan işaretlemenin beklenen değeri pozitife döner.'],
    ]),
    icerik: `<div class="kart"><p style="margin:0;font-size:19px"><b>Net = Doğru − (Yanlış ÷ 4)</b></p></div>
<p>Hesap her test için <b>ayrı ayrı</b> yapılır; testler arasında yanlış mahsuplaşması olmaz.</p>
<h2>Örneklerle</h2>
<table>
  <tr><th>Doğru</th><th>Yanlış</th><th>Boş</th><th>Net</th></tr>
  <tr><td>22</td><td>4</td><td>4</td><td><b>21,00</b></td></tr>
  <tr><td>18</td><td>12</td><td>0</td><td><b>15,00</b></td></tr>
  <tr><td>25</td><td>0</td><td>5</td><td><b>25,00</b></td></tr>
  <tr><td>15</td><td>15</td><td>0</td><td><b>11,25</b></td></tr>
</table>
<h2>Boş bırakmalı mı?</h2>
<p>Beş şıklı bir soruda tamamen rastgele işaretlersen beklenen kazancın sıfırdır: ortalama 5 sorudan
1'ini doğru yapar, 4 yanlışla o 1 doğruyu geri verirsin. Ama <b>bir şıkkı bile kesin elediysen</b>
oran 1/4'e çıkar ve işaretlemek matematiksel olarak kazançlı hale gelir. İki şık elediysen açık ara
avantajlıdır.</p>
<p>Yani "emin değilsem boş bırakayım" kuralı, çeldirici eleyebiliyorsan yanlıştır.</p>
<h2>Netten puana</h2>
<p>Net tek başına puan değildir. ÖSYM netleri o yılki ortalama ve standart sapmaya göre standart
puana çevirir, sonra puan türünün ağırlıklarıyla birleştirir. Ayrıntı için
<a href="/kpss-puan-turleri">puan türleri</a> ve <a href="/kpss-puan-hesaplama">puan hesaplama</a>
sayfalarına bak.</p>
<div class="kart" style="text-align:center">
  <p style="margin:0 0 10px;font-weight:700">Netlerini gir, tahmini puanını gör</p>
  <a class="cta" href="/puan-hesapla">Puan Hesaplayıcıyı Aç</a>
</div>
${uyari}`,
  },
  {
    yol: '/kpss-puan-turleri',
    baslik: 'KPSS Puan Türleri — P1, P2, P3, P10, P93, P121 | KPSS Akademi',
    aciklama: 'KPSS puan türleri ve ağırlıkları: P1 (GY %70 GK %30), P2, P3 (%50-%50), P93 ön lisans, P10 öğretmenlik, P121 ÖABT.',
    h1: 'KPSS Puan Türleri',
    jsonLd: sss([
      ['P3 puanı nedir?', 'P3, Genel Yetenek %50 ve Genel Kültür %50 ağırlıkla hesaplanan lisans düzeyi puan türüdür; en yaygın kullanılan puandır.'],
      ['P1 ile P3 farkı nedir?', 'P1’de Genel Yetenek %70, Genel Kültür %30 ağırlıktadır; P3’te ikisi de %50’dir. Türkçe ve Matematiği güçlü adaylar P1’de daha yüksek puan alır.'],
    ]),
    icerik: `<p>KPSS'de tek bir puan yoktur; kadronun türüne göre farklı ağırlıklarla hesaplanan puan türleri
kullanılır. Aynı netlerle farklı puan türlerinde farklı sonuçlar çıkar.</p>
<table>
  <tr><th>Puan</th><th>Düzey</th><th>Ağırlık</th></tr>
  <tr><td><b>P1</b></td><td>Lisans</td><td>Genel Yetenek %70 · Genel Kültür %30</td></tr>
  <tr><td><b>P2</b></td><td>Lisans</td><td>Genel Yetenek %60 · Genel Kültür %40</td></tr>
  <tr><td><b>P3</b></td><td>Lisans</td><td>Genel Yetenek %50 · Genel Kültür %50</td></tr>
  <tr><td><b>P93</b></td><td>Ön Lisans</td><td>Genel Yetenek %50 · Genel Kültür %50</td></tr>
  <tr><td><b>P10</b></td><td>Öğretmenlik</td><td>GY %30 · GK %30 · Eğitim Bilimleri %40</td></tr>
  <tr><td><b>P121</b></td><td>ÖABT'li</td><td>GY %15 · GK %15 · Eğitim Bilimleri %20 · ÖABT %50</td></tr>
</table>
<h2>Hangi puan türü senin için önemli?</h2>
<p>Başvurmayı düşündüğün kadronun ilanında hangi puan türünün istendiği yazar. Genel idare
hizmetlerinde çoğunlukla <b>P3</b>, bazı uzman kadrolarında <b>P1</b> veya <b>P2</b> kullanılır.
Öğretmenlikte ÖABT'si olan branşlarda <b>P121</b>, olmayanlarda <b>P10</b> geçerlidir.</p>
<h2>Ağırlıklar stratejini değiştirir</h2>
<p>P1'de Genel Yetenek'in ağırlığı Genel Kültür'ün iki katından fazladır. Türkçe ve Matematiği güçlü
bir aday P1'de, Tarih–Coğrafya'sı güçlü bir aday P3'te daha avantajlıdır. Hangi kadroyu hedeflediğini
bilmek, hangi derse ağırlık vereceğini de belirler.</p>
<p style="color:var(--soluk);font-size:14px">Ağırlıklar ÖSYM kılavuzlarında zaman zaman güncellenebilir; başvuru öncesi güncel kılavuzu kontrol et.</p>
<div class="kart" style="text-align:center">
  <p style="margin:0 0 10px;font-weight:700">Netlerini altı puan türünde birden hesapla</p>
  <a class="cta" href="/puan-hesapla">Puan Hesaplayıcı</a>
  <a class="cta ikincil" href="/hedef">Hedef Puan Planı</a>
</div>
${uyari}`,
  },
  {
    yol: '/kpss-deneme-sinavi',
    baslik: 'KPSS Deneme Sınavı Çöz — Ücretsiz, Süreli, Puan Hesaplı | KPSS Akademi',
    aciklama: 'Gerçek ÖSYM formatında ücretsiz KPSS deneme sınavları: 120 soru 130 dakika, süreli, net ve puan hesaplı. Üyelik gerekmez.',
    h1: 'KPSS Deneme Sınavı',
    jsonLd: sss([
      ['KPSS denemesi kaç soru olmalı?', 'Gerçek sınav düzeninde bir Genel Yetenek–Genel Kültür denemesi 120 soru ve 130 dakikadır. Daha kısa denemeler süre yönetimini ölçmez.'],
      ['Deneme sınavı ne sıklıkla çözülmeli?', 'Konu çalışması sürerken haftada bir branş denemesi, sınava son bir ayda haftada bir tam deneme yaygın bir düzendir.'],
    ]),
    icerik: `<p>Deneme sınavının amacı bilgi ölçmek değil, <b>süre yönetimini ve dayanıklılığı</b> ölçmektir.
20 soruluk kısa testler bunu yapamaz; 120 soruyu 130 dakikada bitirebilmek ayrı bir beceridir ve
ancak gerçek düzende denenerek kazanılır.</p>
<h2>Nasıl çözmeli?</h2>
<ul>
  <li>Süreyi başlat ve <b>durdurma</b>. Gerçek sınavda mola yok.</li>
  <li>Telefonu uzağa koy, tek oturuşta bitir.</li>
  <li>Emin olmadığın soruyu işaretle, geç; sonunda dön.</li>
  <li>Bitince sadece puana bakma — <b>hangi konuda kaybettiğine</b> bak.</li>
</ul>
<h2>Sonrası daha önemli</h2>
<p>Denemeyi çözmek işin kolay kısmı. Asıl kazanç, yanlışları tek tek incelemekte. KPSS Akademi'de
yanlış yaptığın sorular otomatik olarak <b>Yanlışlarım</b> listesine ve aralıklı tekrar kuyruğuna
düşer; birkaç gün sonra karşına tekrar çıkar.</p>
<h2>Buradaki denemeler</h2>
<ul>
  <li><b>Genel Yetenek–Genel Kültür</b> — 120 soru / 130 dakika, gerçek ÖSYM dağılımıyla</li>
  <li><b>Eğitim Bilimleri</b> — 80 soru / 100 dakika</li>
  <li><b>Alan Bilgisi</b> — 40 soru / 50 dakika, yedi A grubu dersi için ayrı ayrı</li>
  <li><b>Branş denemeleri</b> — tek ders, 30 soru / 35 dakika</li>
</ul>
<p>Denemeler süreli çalışır, net ve KPSS puanını otomatik hesaplar, sonuçta ders ders doğru–yanlış
dağılımını gösterir. Tamamı ücretsizdir ve üyelik gerektirmez.</p>
<div class="kart" style="text-align:center">
  <p style="margin:0 0 10px;font-weight:700">Hemen bir deneme çöz</p>
  <a class="cta" href="/denemeler">Denemeleri Aç</a>
  <a class="cta ikincil" href="/kpss-net-hesaplama">Net Hesaplama</a>
</div>
${uyari}`,
  },
  {
    yol: '/kpss-calisma-programi',
    baslik: 'KPSS Çalışma Programı — Kaç Ay, Günde Kaç Soru? | KPSS Akademi',
    aciklama: 'KPSS çalışma programı nasıl yapılır: ders ağırlıklarına göre süre dağılımı, günlük soru hedefi, tekrar düzeni ve sınava son ay planı.',
    h1: 'KPSS Çalışma Programı',
    icerik: `<p>Program yapmanın amacı çok çalışmak değil, <b>doğru yere çalışmak</b>. Aşağıdaki düzen
ders ağırlıklarına ve unutma eğrisine göre kurulmuştur.</p>
<h2>1. Süreyi ağırlığa göre böl</h2>
<p>Türkçe ve Matematik sınavın yarısıdır (60/120). Her derse eşit süre vermek, 6 soruluk Güncel
Bilgiler'e 30 soruluk Matematik kadar zaman ayırmak demektir. Süreyi
<a href="/kpss-soru-dagilimi">soru dağılımına</a> göre paylaştır.</p>
<h2>2. Konu anlatımı ve soru çözümünü ayırma</h2>
<p>Bir konuyu okuyup hemen o konudan soru çözmek, önce tüm dersi bitirip sonra soruya geçmekten
belirgin şekilde daha kalıcıdır. Konuyu bitirir bitirmez 15-20 soru çöz.</p>
<h2>3. Yanlışları biriktir</h2>
<p>Yeni soru çözmek, eski yanlışını tekrar etmekten daha az kazandırır. Yanlış yaptığın soru
kaybedilmiş değil, henüz öğrenilmemiş bilgidir. Aralıklı tekrar bu yüzden çalışır: doğru bildiğin
soru 3, 7, 16, 35 gün sonra; yanlış bildiğin yarın karşına çıkar.</p>
<h2>4. Günlük hedefi somut tut</h2>
<p>"Bugün Tarih çalışacağım" ölçülemez. "Bugün 60 soru" ölçülebilir. Hedefini soru sayısı olarak
belirle; KPSS Akademi ana sayfada günlük hedef takibi ve çalışma serisi tutar.</p>
<h2>5. Son ay</h2>
<ul>
  <li>Yeni konu <b>açma</b>. Bu aşamada eksik kapatmak yerine bilineni sağlamlaştırmak kazandırır.</li>
  <li>Haftada bir <b>tam deneme</b>, gerçek saatte ve tek oturuşta.</li>
  <li>Kalan günler yanlış tekrarı ve zayıf konular.</li>
  <li>Son 3 gün sadece tekrar; yeni soru bile çözme.</li>
</ul>
<div class="kart" style="text-align:center">
  <p style="margin:0 0 10px;font-weight:700">Hedef puanına göre günlük soru sayını hesapla</p>
  <a class="cta" href="/hedef">Hedef Puan Planı</a>
  <a class="cta ikincil" href="/analiz">Zayıf Konularım</a>
</div>
${uyari}`,
  },
  {
    yol: '/kpss-on-lisans',
    baslik: 'KPSS Ön Lisans 2026 — Tarih, Konular ve Soru Dağılımı | KPSS Akademi',
    aciklama: 'KPSS Ön Lisans 2026: 4 Ekim 2026, 120 soru 130 dakika. Konular, soru dağılımı, P93 puan türü ve ücretsiz soru bankası.',
    h1: 'KPSS Ön Lisans',
    jsonLd: sss([
      ['KPSS Ön Lisans ne zaman?', 'KPSS Ön Lisans sınavı 4 Ekim 2026 tarihinde yapılacaktır.'],
      ['KPSS Ön Lisans kaç soru?', '120 soru, 130 dakikadır. Türkçe 30, Matematik 30, Tarih 27, Coğrafya 18, Vatandaşlık 9, Güncel Bilgiler 6 soru sorulur.'],
    ]),
    icerik: `<p>KPSS Ön Lisans, iki yıllık meslek yüksekokulu mezunlarının girdiği oturumdur.
<b>4 Ekim 2026</b> tarihinde yapılacaktır.</p>
<table>
  <tr><th>Ders</th><th>Soru</th></tr>
  ${GYGK_DAGILIM.map(([ad, n]) => `<tr><td><a href="/kpss-${slug(ad)}">${esc(ad)}</a></td><td><b>${n}</b></td></tr>`).join('')}
  <tr><td><b>Toplam</b></td><td><b>120 soru / 130 dakika</b></td></tr>
</table>
<p>Ders dağılımı Lisans oturumuyla aynıdır; fark soru sayısında değil zorluk seviyesindedir.
Puan türü <b>P93</b>'tür (Genel Yetenek %50, Genel Kültür %50).</p>
<h2>Nasıl çalışmalı?</h2>
<p>Soru dağılımı aynı olduğu için Lisans kaynaklarıyla çalışmak sorun değildir; hatta biraz daha
zor sorularla çalışmak sınavda rahatlatır. KPSS Akademi'deki 16.000'den fazla soru, bilgi kartları
ve deneme sınavlarının tamamı Ön Lisans için de geçerlidir.</p>
<div class="kart" style="text-align:center">
  <a class="cta" href="/denemeler">Deneme Çöz</a>
  <a class="cta ikincil" href="/kpss-konulari">Konu Listesi</a>
</div>
${uyari}`,
  },
  {
    yol: '/kpss-ortaogretim',
    baslik: 'KPSS Ortaöğretim 2026 — Tarih, Konular ve Soru Dağılımı | KPSS Akademi',
    aciklama: 'KPSS Ortaöğretim (Lise) 2026: 25 Ekim 2026, 120 soru 130 dakika. Konular, soru dağılımı ve ücretsiz soru bankası.',
    h1: 'KPSS Ortaöğretim',
    jsonLd: sss([
      ['KPSS Ortaöğretim ne zaman?', 'KPSS Ortaöğretim (Lise) sınavı 25 Ekim 2026 tarihinde yapılacaktır.'],
      ['KPSS Ortaöğretim kaç soru?', '120 soru, 130 dakikadır. Ders dağılımı Lisans ve Ön Lisans ile aynıdır.'],
    ]),
    icerik: `<p>KPSS Ortaöğretim, lise ve dengi okul mezunlarının girdiği oturumdur.
<b>25 Ekim 2026</b> tarihinde yapılacaktır.</p>
<table>
  <tr><th>Ders</th><th>Soru</th></tr>
  ${GYGK_DAGILIM.map(([ad, n]) => `<tr><td><a href="/kpss-${slug(ad)}">${esc(ad)}</a></td><td><b>${n}</b></td></tr>`).join('')}
  <tr><td><b>Toplam</b></td><td><b>120 soru / 130 dakika</b></td></tr>
</table>
<p>Soru sayıları Lisans ve Ön Lisans ile birebir aynıdır. Ortaöğretim düzeyi üç oturum içinde en
temel zorluk seviyesine sahiptir; sorular daha çok doğrudan bilgi ve temel yorum ölçer.</p>
<h2>Nereden başlamalı?</h2>
<p>Türkçe ve Matematik sınavın yarısını oluşturur ve bu iki derste ilerleme en hızlı görülen
alandır. Temel işlemler, paragraf ve sözcükte anlam ile başlamak, Genel Kültür ezberine
girmekten daha erken kazanç sağlar.</p>
<div class="kart" style="text-align:center">
  <a class="cta" href="/dersler">Soru Çözmeye Başla</a>
  <a class="cta ikincil" href="/kpss-calisma-programi">Çalışma Programı</a>
</div>
${uyari}`,
  },
]
sayfalar.push(...uzunKuyruk)



for (const s of sayfalar) {
  const klasor = join(DIST, s.yol.slice(1))
  await mkdir(klasor, { recursive: true })
  await writeFile(join(klasor, 'index.html'), sayfa({ ...s, guncelleme: bugun }), 'utf8')
  console.log(`  ✓ dist${s.yol}/index.html`)
}

/* Ana sayfa için uygulama şeması + sitemap */
const uygulamaLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'KPSS Akademi',
  url: SITE + '/',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web, Android',
  inLanguage: 'tr',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
  description:
    'KPSS soru bankası, bilgi kartları, deneme sınavları, coğrafya harita oyunları ve puan hesaplayıcı. Tarayıcıda çalışır, çevrimdışı kullanılabilir.',
}
/* Ana sayfa, JavaScript çalıştırmayan bir istemciye tek kelime metin
   göstermiyordu (gövde yalnızca boş <div id="root">). Arama motorları ve
   AdSense inceleme tarayıcısı ilk isteği böyle görüyor. Aşağıdaki blok #root
   içine yazılır; React ilk render'da onun yerini alır, kullanıcı tarafında
   hiçbir şey değişmez. Metin uygulamanın gerçekte sunduğunu anlatır ve tüm
   bölümlere iç bağlantı verir. */
const ist = index.istatistik || {}
const toplamSoru = ist.soru ?? index.dersler.reduce((t, d) => t + (d.soruSayisi || 0), 0)
const toplamKart = ist.kart ?? index.dersler.reduce((t, d) => t + (d.kartSayisi || 0), 0)
const tr = (n) => Number(n).toLocaleString('tr-TR')

const onIcerik = `<div id="on-icerik" style="max-width:820px;margin:0 auto;padding:24px 20px 48px;font:16px/1.65 Inter,system-ui,sans-serif">
<h1 style="font-size:28px;letter-spacing:-.02em;margin:0 0 10px">KPSS Akademi — Ücretsiz KPSS Soru Bankası ve Çalışma Uygulaması</h1>
<p>KPSS Akademi, Genel Yetenek, Genel Kültür, Eğitim Bilimleri ve Alan Bilgisi derslerine
çalışmak için hazırlanmış ücretsiz bir çalışma uygulamasıdır. Tarayıcıda çalışır, telefona
kurulabilir ve çevrimdışı kullanılabilir. Üyelik gerekmez; ilerlemen kendi cihazında saklanır.</p>
<ul>
  <li><b>${tr(toplamSoru)} soru</b> — çözüm açıklamalı, ders ve konu bazlı</li>
  <li><b>${tr(toplamKart)} bilgi kartı</b> — çevir-öğren, sesli okuma destekli</li>
  <li><b>${konular.length} konu anlatımı</b> — özet, bölümlü metin ve konudan soru çözme</li>
  <li><b>Deneme sınavları</b> — süreli, net ve KPSS puanı hesaplı</li>
  <li><b>Coğrafya ve tarih oyunları</b> — harita, eşleştirme, kronoloji (reklamsız)</li>
  <li><b>Puan hesaplayıcı</b> — P1, P2, P3, P93, P10 ve P121 puan türleri</li>
</ul>

<h2 style="font-size:20px;margin:30px 0 8px">Dersler</h2>
${Object.entries(gruplar)
  .map(
    ([g, dersler]) => `<p style="margin:12px 0 4px"><b>${esc(GRUP_ADI[g] || g)}</b></p>
<p style="margin:0">${dersler
      .map(
        (d) =>
          `<a href="/kpss-${slug(d.ad)}" style="display:inline-block;margin:0 10px 6px 0">${esc(d.ad)}</a>` +
          `<span style="color:#667492;font-size:13px;margin-right:10px">${tr(d.soruSayisi || 0)} soru</span>`
      )
      .join('')}</p>`
  )
  .join('\n')}

<h2 style="font-size:20px;margin:30px 0 8px">Rehberler</h2>
<ul>
  <li><a href="/kpss-nedir">KPSS Nedir? Sınav yapısı, soru dağılımı ve puanlama</a></li>
  <li><a href="/kpss-ne-zaman">KPSS ne zaman? 2026 sınav tarihleri</a></li>
  <li><a href="/kpss-soru-dagilimi">KPSS soru dağılımı — hangi dersten kaç soru</a></li>
  <li><a href="/kpss-net-hesaplama">KPSS net hesaplama — 4 yanlış 1 doğruyu götürür</a></li>
  <li><a href="/kpss-puan-turleri">KPSS puan türleri — P1, P2, P3, P10, P93, P121</a></li>
  <li><a href="/kpss-deneme-sinavi">KPSS deneme sınavı nasıl çözülür</a></li>
  <li><a href="/kpss-calisma-programi">KPSS çalışma programı</a></li>
  <li><a href="/kpss-on-lisans">KPSS Ön Lisans</a> · <a href="/kpss-ortaogretim">KPSS Ortaöğretim</a></li>
  <li><a href="/kpss-konulari">KPSS Konuları — ${index.dersler.length} ders, ${konular.length} konu listesi</a></li>
  <li><a href="/kpss-puan-hesaplama">KPSS Puan Hesaplama — net, standart puan ve ağırlıklar</a></li>
</ul>

<h2 style="font-size:20px;margin:30px 0 8px">Bölümler</h2>
<p><a href="/dersler">Dersler</a> · <a href="/kartlar">Bilgi Kartları</a> ·
<a href="/quiz">Quiz</a> · <a href="/denemeler">Denemeler</a> ·
<a href="/oyunlar">Oyunlar</a> · <a href="/puan-hesapla">Puan Hesapla</a> ·
<a href="/istatistik">İstatistik</a></p>

<p style="color:#667492;font-size:13px;margin-top:34px">
<a href="/hakkinda">Hakkında</a> · <a href="/gizlilik">Gizlilik</a> · <a href="/iletisim">İletişim</a> ·
<a href="https://play.google.com/store/apps/details?id=com.nihangokdemir.kpss">Android uygulaması</a><br>
KPSS Akademi bağımsız bir çalışma aracıdır; ÖSYM ile resmî bir bağlantısı yoktur.
Sınav tarihleri ve resmî sonuçlar için osym.gov.tr esas alınmalıdır.</p>
</div>
<script>
/* Bu blok ana sayfanın özetidir; arama motoru ve AdSense tarayıcısı içindir.
   Ama sunucu /dersler, /quiz gibi TÜM yolları da aynı index.html ile
   karşılıyor. O yollarda React yüklenene kadar ekranda ana sayfa metni
   duruyordu — kullanıcı "tıkladım ama açılmadı" diye görüyordu.
   Ana sayfa dışındaki yollarda anında kaldırılıyor. */
if (location.pathname !== '/') { var _o = document.getElementById('on-icerik'); if (_o) _o.remove() }
</script>`

const anaSayfa = join(DIST, 'index.html')
let html = await readFile(anaSayfa, 'utf8')
if (!html.includes('WebApplication')) {
  html = html.replace('</head>', `<script type="application/ld+json">${JSON.stringify(uygulamaLd)}</script>\n</head>`)
}
if (html.includes('<div id="root"></div>')) {
  html = html.replace('<div id="root"></div>', `<div id="root">${onIcerik}</div>`)
  console.log('  ✓ dist/index.html — ön içerik + WebApplication şeması eklendi')
} else {
  console.log('  ! dist/index.html — <div id="root"></div> bulunamadı, ön içerik eklenmedi')
}
await writeFile(anaSayfa, html, 'utf8')

const sitemapYollari = [
  ['/', '1.0', 'weekly'],
  ['/kpss-nedir', '0.9', 'monthly'],
  ['/kpss-konulari', '0.9', 'monthly'],
  ['/kpss-puan-hesaplama', '0.9', 'monthly'],
  ['/dersler', '0.8', 'weekly'],
  ['/denemeler', '0.8', 'weekly'],
  ['/kartlar', '0.7', 'weekly'],
  ['/quiz', '0.7', 'weekly'],
  ['/oyunlar', '0.7', 'monthly'],
  ['/puan-hesapla', '0.7', 'monthly'],
  ['/hakkinda', '0.4', 'yearly'],
  ['/iletisim', '0.4', 'yearly'],
  ['/gizlilik', '0.3', 'yearly'],
]
const bugunISO = new Date().toISOString().slice(0, 10)
for (const d of dersSayfalari) sitemapYollari.push([d.yol, '0.8', 'monthly'])
for (const u of uzunKuyruk) sitemapYollari.push([u.yol, '0.9', 'monthly'])
for (const a of anlatimSayfalari) sitemapYollari.push([a.yol, '0.6', 'monthly'])
await writeFile(
  join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapYollari
  .map(
    ([y, p, f]) =>
      `  <url><loc>${SITE}${y}</loc><lastmod>${bugunISO}</lastmod><changefreq>${f}</changefreq><priority>${p}</priority></url>`
  )
  .join('\n')}
</urlset>
`,
  'utf8'
)
console.log(`  ✓ dist/sitemap.xml — ${sitemapYollari.length} adres`)

/* Service worker sürüm damgası.
   sw.js içeriği değişmezse tarayıcı güncelleme olduğunu anlamaz ve "yeni sürüm
   hazır" bildirimi hiç çıkmaz. Burada VERSION, derlenmiş dosya adlarının
   özetiyle damgalanır: içerik değişmediyse damga da değişmez (gereksiz
   güncelleme bildirimi çıkmaz), değiştiyse otomatik yenilenir. */
const varliklar = await readdir(join(DIST, 'assets')).catch(() => [])
const swYolu = join(DIST, 'sw.js')
let sw = await readFile(swYolu, 'utf8')
/* sw.js'in KENDİ içeriği de damgaya girer. Aksi hâlde yalnızca service worker
   mantığı değiştiğinde damga sabit kalır; cache adları aynı kaldığı için
   activate eski cache'leri silmez ve bayat app shell kullanılmaya devam eder
   (ilk tıklamada boş ekran, yenileyince düzelme belirtisi tam olarak budur). */
const damga = createHash('sha256')
  .update(varliklar.sort().join('|') + ' ' + sw)
  .digest('hex')
  .slice(0, 8)
const yeniSurum = `ka-${JSON.parse(await readFile(join(KOK, 'package.json'), 'utf8')).version}-${damga}`
sw = sw.replace(/const VERSION = '[^']*'/, `const VERSION = '${yeniSurum}'`)
await writeFile(swYolu, sw, 'utf8')
console.log(`  ✓ dist/sw.js — sürüm damgası ${yeniSurum}`)
