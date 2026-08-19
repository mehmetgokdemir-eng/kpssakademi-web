# KPSS Akademi — Web (PWA) sürümü

Android uygulamasının (`com.nihangokdemir.kpss`) tarayıcıda çalışan karşılığı.
Kurulum gerektirmez, çevrimdışı çalışır, "ana ekrana ekle" ile uygulama gibi kullanılır.
Hedef adres: **kpssakademi.tr**

---

## 1. Hızlı başlangıç

```bash
npm install
npm run dev        # http://localhost:5173
```

Yayına almak için:

```bash
npm run build      # çıktı: dist/
npm run preview    # dist klasörünü yerelde test et
```

`dist/` klasörünün içeriğini olduğu gibi sunucuya kopyalayın.

Adım adım yayına alma (GitHub → Vercel → alan adı): **`DEPLOY.md`**
AdSense kurulumu: **`ADSENSE.md`**

---

## 2. Yayınlama

### Paylaşımlı hosting / cPanel (Apache)

`dist/` içeriğini `public_html/` altına atın. `public/.htaccess` dosyası build ile
birlikte `dist/.htaccess` olarak kopyalanır ve şunları yapar:

- HTTPS ve www'suz adrese 301 yönlendirme
- SPA yönlendirmesi (`/dersler` gibi adreslerde 404 olmaz)
- statik dosyalar için uzun cache, `sw.js` için no-cache

> cPanel dosya yöneticisinde gizli dosyalar kapalıysa `.htaccess` görünmez —
> "Show hidden files" seçeneğini açın ve dosyanın yüklendiğinden emin olun.

### Netlify / Vercel / Cloudflare Pages

- Build komutu: `npm run build`
- Yayın klasörü: `dist`
- SPA yönlendirmesi için `public/_redirects` zaten hazır (Netlify).
  Vercel için kök dizine `vercel.json` ekleyin:
  ```json
  { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
  ```

### Alt dizinde yayınlama

Site `kpssakademi.tr/uygulama/` gibi bir alt dizinde çalışacaksa
`vite.config.js` içindeki `base: '/'` değerini `'/uygulama/'` yapın ve
`public/manifest.webmanifest` içindeki `start_url` / `scope` alanlarını güncelleyin.

---

## 3. İçerik verisi

Tüm içerik `public/data/` altındaki JSON dosyalarından okunur. Uygulama kodu
içeriği bilmez; dosyaları değiştirmek yeniden derleme gerektirmez.

```
public/data/
  index.json              ders listesi + genel istatistik
  konular.json            tüm konular
  sorular/<dersId>.json   ders bazlı soru bankası   (tembel yüklenir)
  kartlar/<dersId>.json   ders bazlı bilgi kartları (tembel yüklenir)
  denemeler.json          deneme listesi (özet)
  denemeler/<id>.json     deneme içeriği (bölümler + sorular)
  bilgiler.json           "Bunu biliyor muydun?" kartları
  notlar/<dersId>.json    konu anlatımları (bölümlü)
  oyunlar/harita.json     Türkiye haritası + coğrafya oyunu konumları
  oyunlar/kronoloji.json  tarih sıralama oyunu
  oyunlar/eslestirme.json eşleştirme oyunu
  oyunlar/dogrumu.json    doğru/yanlış oyunu
```

16.000+ soru tek dosyada tutulmaz; ders bazlı bölündüğü için kullanıcı yalnızca
açtığı dersin verisini indirir.

### Şemalar

**index.json**

```jsonc
{
  "surum": 1,
  "guncelleme": "2026-08-17",
  "dersler": [
    {
      "id": "tarih", "ad": "Tarih",
      "grup": "gk",              // gy | gk | eb | ab
      "ikon": "tarih",           // turkce|matematik|tarih|cografya|vatandaslik|guncel|egitimbilimleri
      "renk": "#1baf7a", "renkKoyu": "#199e70",
      "soruSayisi": 4200, "kartSayisi": 310, "konuSayisi": 18
    }
  ],
  "istatistik": { "sorular": 16066, "kartlar": 981, "konular": 113, "denemeler": 32 }
}
```

**sorular/&lt;dersId&gt;.json**

```jsonc
[
  {
    "id": "s00001",
    "dersId": "tarih",
    "konuId": "tarih-osmanli-kurulus",
    "soru": "…",
    "secenekler": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı", "E şıkkı"],
    "dogru": 2,                  // 0 tabanlı indeks
    "aciklama": "…",             // isteğe bağlı
    "gorsel": "/media/soru1.png" // isteğe bağlı
  }
]
```

**notlar/&lt;dersId&gt;.json**

```jsonc
[
  {
    "konuId": "i_lk_turk_devletleri", "dersId": "tarih",
    "baslik": "İlk Türk Devletleri",
    "ozet": "…",
    "bolumler": [ { "baslik": "Orta Asya'nın İlk Sakinleri", "icerik": "• …\n• …" } ]
  }
]
```

**kartlar/&lt;dersId&gt;.json** — `{ id, dersId, konuId, on, arka }`.
`arka` içindeki `#Etiket` ifadeleri otomatik olarak rozet şeklinde gösterilir.

**denemeler/&lt;id&gt;.json**

```jsonc
{
  "id": "gy-deneme-1", "ad": "Genel Yetenek Denemesi 1",
  "tur": "genel",          // genel | brans
  "sure": 35,              // dakika
  "puanTuru": "P3",        // P1 | P2 | P3 | P10 | P121
  "bolumler": [ { "dersId": "turkce", "ad": "Türkçe", "sorular": [ /* soru nesneleri */ ] } ]
}
```

---

## 4. Android içeriğini aktarma

İçerik **zaten aktarılmış** durumda (16.066 soru, 981 kart, 113 konu anlatımı).
Assets güncellenirse yeniden aktarmak için:

```bash
node tools/android-assets-aktar.mjs <android>/app/src/main/assets --duzelt
```

Bu betik Android'deki şemayı birebir bilir ve `--duzelt` ile bilinen içerik
hatalarını (yanlış cevap anahtarı, sızmış artık şıklar) aktarım sırasında
düzeltir; düzeltmeler betiğin başındaki `DUZELTMELER` sabitinde gerekçeleriyle
listelidir.

Şeması bilinmeyen bir kaynaktan aktarım için genel amaçlı araç da duruyor:

```bash
node tools/import-android-assets.mjs <klasör> --kuru   # önce ne bulduğunu gör
npm run import:assets -- <klasör>
```

Desteklenen kaynaklar: `.json`, `.csv`, `.db/.sqlite` (Room veritabanı dahil).
Alan adları otomatik eşlenir (`soru/question/soru_metni`, `secenek_a…e`,
`dogru_cevap/answer`, `ders/subject`, `konu/topic`, `on_yuz/arka_yuz`, …).

Şemanız tanınmazsa `tools/alan-eslesme.json` oluşturup elle tanımlayın:

```json
{ "soru": ["soru_baslik"], "secenekler": ["siklar_json"], "dogru": ["cevap_no"] }
```

Doğru cevap sayı olarak tutuluyorsa (0 mı 1 mi tabanlı) otomatik saptanır;
yanlış saptanırsa `--taban 0` ya da `--taban 1` verin.

> İçe aktarma `sorular/`, `kartlar/`, `konular.json` ve `index.json` dosyalarını
> yeniler; `denemeler`, `bilgiler` ve `oyunlar` dosyalarına dokunmaz.

Örnek veriyi yeniden üretmek için: `node tools/ornek-veri-uret.mjs`

### Android kaynak kodundaki hazır veri

Bazı içerik Android'de `assets/` altında değil, doğrudan Kotlin kaynağında sabit duruyor
(113 konu listesi, Türkiye sınır poligonu, 52 coğrafi konum, kronoloji olayları).
Bunları aktarmak için:

```bash
npm run veri:android -- ../kpss-app
```

Bu komut `konular.json`, `index.json`, `oyunlar/harita.json` ve `oyunlar/kronoloji.json`
dosyalarını yeniler. Soru ve kart dosyalarına dokunmaz.

---

## 5. Arka plan müziği

`public/media/` altına Android'deki `res/raw` dosyalarını kopyalayın:

```
chopin_nocturne_op9.mp3
guitar_ambient.mp3
```

Dosya yoksa oynatıcı sessizce gizlenir. Parça listesi
`src/components/MusicPlayer.jsx` içindeki `PARCALAR` dizisindedir.

---

## 6. SEO sayfaları

`npm run build` sonunda `tools/seo-sayfa-uret.mjs` çalışır ve şu adresleri **gerçek statik HTML**
olarak üretir (SPA'nın boş index.html'i yerine):

- `/kpss-nedir` — sınav yapısı, soru dağılımı, puan türleri (FAQPage şeması)
- `/kpss-konulari` — 113 konunun tam listesi (ItemList şeması)
- `/kpss-puan-hesaplama` — net → standart puan → ağırlıklandırma (HowTo şeması)

`.htaccess` "dosya varsa doğrudan servis et" kuralına sahip olduğu için bu sayfalar SPA
yönlendirmesine takılmaz. `sitemap.xml` de aynı adımda güncellenir.

Yeni sayfa eklemek için `tools/seo-sayfa-uret.mjs` içindeki `sayfalar` dizisine bir kayıt ekleyin.

## 7. Reklamlar, güncelleme bildirimi ve puan isteği

**Reklamlar** — AdSense, manuel yerleşimli. Kurulum ve reklam birimi kimliklerinin
nereye gireceği `ADSENSE.md` dosyasında. Kimlik girilmediği sürece hiçbir reklam
alanı render edilmez, site reklamsız çalışır. Oyunlarda, soru çözerken ve sınav
sürerken reklam **yoktur**.

**Güncelleme bildirimi** — `src/lib/guncelleme.js` service worker'ı izler; yeni
sürüm indirildiğinde ekranın üstünde "Yeni sürüm hazır / Güncelle" şeridi çıkar.
`sw.js` içindeki `VERSION`, derleme sırasında çıktı dosyalarının özetiyle otomatik
damgalanır — içerik değişmediyse damga da değişmez, gereksiz bildirim çıkmaz.

**Puan isteği** — `src/lib/degerlendirme.js`. En az 50 soru çözülmüş ve 3 ayrı gün
kullanılmışsa ana sayfada Play Store puan isteği kartı çıkar. "Sonra" denirse 90
gün susar, "Bir daha sorma" denirse hiç çıkmaz. Beğenen/beğenmeyen ayrımı yapıp
yalnızca mutlu kullanıcıyı mağazaya yönlendirme (review gating) yapılmaz; puan
verme ve görüş bildirme seçenekleri yan yana durur.

## 8. Proje yapısı

```
src/
  lib/
    data.js       veri yükleme + önbellek
    storage.js    ilerleme deposu (localStorage)
    settings.jsx  kullanıcı ayarları + tema
    kpss.js       KPSS puan hesaplama (P1/P2/P3/P10/P121)
    palette.js    doğrulanmış kategorik renk paleti
    tts.js        sesli okuma (Web Speech API)
  components/     Layout, SoruKarti, Grafik, UI parçaları
  pages/          ekranlar (rotalarla birebir)
  games/          Harita Avcısı, Kronoloji, Eşleştirme, Doğru mu?, Maraton
tools/            veri üretme ve içe aktarma betikleri
public/           statik dosyalar, PWA manifest, service worker, veri
```

## 9. Kullanıcı verisi

Çözüm geçmişi, yanlışlar, kayıtlılar, notlar, deneme sonuçları ve oyun skorları
**yalnızca tarayıcıda** (`localStorage`, `ka:progress:v1` anahtarı) tutulur.
Ayarlar → Verilerim bölümünden JSON olarak yedeklenip geri yüklenebilir.

Sunucu tarafı hesap/senkronizasyon istenirse `src/lib/storage.js` tek dokunma
noktasıdır; `subscribe/getState` arayüzü korunarak uzak bir kaynağa bağlanabilir.

## 10. PWA

`public/sw.js` üç ayrı strateji uygular: HTML için network-first, hash'li build
çıktıları için cache-first, `/data/*.json` için stale-while-revalidate.
Yeni sürüm yayınlarken `sw.js` içindeki `VERSION` değerini artırın — eski
önbellekler otomatik temizlenir.

## 11. Notlar

- Puan hesaplayıcı, geçmiş yıl istatistiklerinden türetilmiş ortalama/standart
  sapma değerlerine dayalı bir **tahmindir**; ÖSYM'nin resmî sonucuyla birebir
  aynı olmayabilir. Referans değerler `src/lib/kpss.js` içindedir.
- Grafik renk paleti renk körlüğü açısından hem açık hem koyu temada
  doğrulanmıştır; ders renklerini değiştirirken `src/lib/palette.js` içindeki
  sırayı bozmayın.
- Oyunlarda reklam yoktur (Android sürümündeki karar korunmuştur).
