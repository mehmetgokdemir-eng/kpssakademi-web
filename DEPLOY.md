# kpssakademi.tr — Yayına alma

mmcep.com'daki yolun aynısı: **GitHub → Vercel → alan adı**.
Bir kez kurulur; sonrasında her `git push` siteyi otomatik günceller.

---

## 1. GitHub deposu

```bash
cd kaynak
git init
git add .
git commit -m "KPSS Akademi web"
```

GitHub'da **kpssakademi-web** adında **private** bir depo aç, sonra:

```bash
git remote add origin https://github.com/<kullanici-adin>/kpssakademi-web.git
git branch -M main
git push -u origin main
```

> `.gitignore` hazır: `node_modules/` ve `dist/` gönderilmez, gerek de yok —
> Vercel derlemeyi kendisi yapar.

---

## 2. Vercel projesi

1. [vercel.com/new](https://vercel.com/new) → GitHub deposunu seç → **Import**
2. Ayarlar kendiliğinden gelir (`vercel.json` dosyası bunları zaten tanımlıyor):
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Deploy** de. Birkaç dakikada `...vercel.app` adresinde yayında olur.

Bu geçici adreste her şeyi bir kez kontrol et: ana sayfa, bir deneme, `/kpss-nedir`.

---

## 3. Alan adı bağlama

Vercel projesi → **Settings → Domains**

1. `kpssakademi.tr` yaz, **Add**.
2. `www.kpssakademi.tr` için de aynısını yap.

### ⚠️ Yönlendirme yönüne dikkat

Alan adı eklerken Vercel "Include apex and www variants" gibi bir seçenek sunar ve
**yönlendirmeyi ters kurabilir** (mmcep.com'da tam olarak bu oldu, sonradan
düzeltmek gerekti). Doğru kurulum:

| Alan adı | Olması gereken |
|---|---|
| `kpssakademi.tr` | **Production** ortamına bağlı (asıl adres) |
| `www.kpssakademi.tr` | **Redirect to another domain → kpssakademi.tr (308)** |

Sitenin kodu her yerde `kpssakademi.tr`yi asıl adres sayıyor (canonical etiketler,
`sitemap.xml`, Open Graph). Ters kurulursa arama motorları iki farklı adres görür.

Kontrol: tarayıcıda `www.kpssakademi.tr` yazınca adres çubuğu `kpssakademi.tr`ye
dönmeli.

### DNS kayıtları

Alan adını aldığın firmanın panelinde (Natro, İsimtescil, GoDaddy vb.):

| Tür | Ad | Değer |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

> Vercel, Domains ekranında sana **kendi gösterdiği** değerleri kullanmanı söyler —
> yukarıdakiler değişebilir, ekrandakini esas al.

DNS yayılması genelde 10–60 dakika sürer. Vercel HTTPS sertifikasını otomatik alır,
ayrıca bir şey yapman gerekmez.

---

## 4. Yayın sonrası

### Google Search Console
1. [search.google.com/search-console](https://search.google.com/search-console) → Mülk ekle → **URL ön eki** → `https://kpssakademi.tr`
2. Doğrulama: DNS TXT kaydı ya da HTML etiketi
3. Sitemaps → `sitemap.xml` gönder

### AdSense
Ayrıntılar `ADSENSE.md` dosyasında. Özet: yayıncı hesabın zaten var
(`pub-6166144150941943`), yeni başvuru gerekmez — panelden **site ekle** ve
reklam birimi kimliklerini `src/lib/reklam.js` içine yapıştır.

### Android uygulamasından bağlantı
Play Store açıklamasına ve uygulama içine `kpssakademi.tr` bağlantısı eklemek
hem trafik hem güven kazandırır.

---

## 5. Güncelleme

```bash
git add .
git commit -m "ne değişti"
git push
```

Vercel otomatik derler ve yayınlar. Geri almak istersen Vercel panelinde
**Deployments → önceki sürüm → Promote to Production**.

---

## Paylaşımlı hosting (alternatif)

Vercel kullanmak istemezsen `npm run build` ile üretilen `dist/` klasörünün
içeriğini (gizli `.htaccess` dosyası dahil) `public_html/` altına kopyalaman
yeterli. `.htaccess`; HTTPS yönlendirmesi, www→apex yönlendirmesi, SPA
yönlendirmesi ve cache başlıklarını zaten içeriyor.

---

## Bilinen tuzak — SPA yolları 404 dönerse

`vercel.json` içindeki `rewrites.source` alanı **path-to-regexp** sözdizimi kullanır,
ham düzenli ifade DEĞİL. Bir dönem burada şu desen vardı:

```json
{ "source": "/((?!.*\\.).*)", "destination": "/index.html" }
```

Negatif ileri bakış `(?!...)` desteklenmediği için kural hiç eşleşmedi. Sonuç:
`/dersler`, `/quiz`, `/ders/matematik` gibi TÜM uygulama yolları doğrudan
açıldığında 404 döndü. Uygulama içinde tıklamak çalışıyordu (yönlendirme
tarayıcıda yapılıyor, sunucuya gitmiyor), bu yüzden hata gözden kaçtı.

Doğrusu basit yakala-hepsini desenidir:

```json
{ "source": "/(.*)", "destination": "/index.html" }
```

Vercel yeniden yazma kurallarını **dosya sistemi kontrolünden sonra** uygular;
gerçek dosyalar (`/assets/*`, `/data/*`, `/kpss-nedir`, `/konu/...`, `ads.txt`,
`sitemap.xml`) önce servis edilir, yalnızca eşleşmeyen yollar `index.html`'e düşer.

**Her yayından sonra kontrol edin** — tarayıcıda gezinmek yetmez, adresleri
doğrudan açın:

```
/dersler   /quiz   /denemeler   /ders/matematik   /oyunlar   /puan-hesapla
```

Hepsi uygulamayı açmalı. Biri 404 dönerse yeniden yazma kuralı bozulmuştur.
