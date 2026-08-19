# AdSense kurulumu — kpssakademi.tr

Yayıncı hesabın zaten var: **pub-6166144150941943** (AdMob ile aynı hesap).
Yeni başvuru yapmana gerek yok, siteyi mevcut hesaba eklemen yeterli.

Model: **otomatik reklamlar + manuel birimler birlikte.**
Oyun, soru çözme, sınav ve bilgi kartı ekranlarında reklam görünmez.

---

## 1. Siteyi AdSense'e ekle (inceleme sürüyorsa atla)

[adsense.google.com](https://adsense.google.com) → **Siteler** → **Site ekle** → `kpssakademi.tr`

**Doğrulama yöntemi olarak META ETİKET'i seç.** Etiket zaten `index.html` içinde:

```html
<meta name="google-adsense-account" content="ca-pub-6166144150941943" />
```

> mmcep.com'da kod snippet'i yöntemi başarısız olmuştu (script sonradan
> yüklendiği için Google'ın robotu kaynakta göremedi), meta etiket geçmişti.
> Burada da meta etiketle git.

İnceleme genelde birkaç gün sürer. Bu sürede site canlı ve içerik dolu olmalı.
**Onay gelmeden aşağıdaki adımlar reklam göstermez** — ayarları şimdiden
yapabilirsin, onay gelince kendiliğinden çalışmaya başlar.

---

## 2. Otomatik reklamları aç

AdSense → **Reklamlar → Sitelere göre** → `kpssakademi.tr` satırındaki
**kalem (düzenle)** simgesi.

Sağdaki panelde:

| Ayar | Önerilen | Neden |
|---|---|---|
| **Otomatik reklamlar** | Açık | Ana model bu |
| **Sayfa içi reklamlar** (in-page) | Açık | Metin arası yerleşimler |
| **Yan çapa reklamı** (anchor) | Açık | Mobilde en çok kazandıran birim |
| **Vinyet** (vignette / tam ekran geçiş) | **Kapalı** | Soru→sonuç geçişinde tam ekran açılırsa deneyim ve yanlış tıklama riski yüksek |
| **Yan tarafta yer alan reklamlar** (side rail) | Açık | Yalnızca geniş masaüstünde çıkar, içeriği itmez |
| **Reklam yükü** | ~%50–65 | Başlangıç için ölçülü; 2–3 hafta sonra RPM'e bakıp ayarla |
| **Mevcut reklam birimlerini kullan** | Açık | Manuel birimlerle çakışmayı Google kendisi çözer |

**Kaydet** dedikten sonra değişikliklerin yayılması ~1 saat sürebilir.

> Vinyeti sonradan denemek istersen aç, ama önce birkaç gün oturum süresi ve
> hemen çıkma oranını izle. Sınav uygulamasında en riskli format budur.

---

## 3. Reklamsız kalacak sayfaları hariç tut

Aynı panelde **Sayfa hariç tutmaları → Hariç tutma ekle**. Kural türü olarak
**"şununla başlar"** seç ve şu URL'leri gir:

```
kpssakademi.tr/oyun/
kpssakademi.tr/quiz/oyna
kpssakademi.tr/deneme/
kpssakademi.tr/kartlar/
```

Soru çözme ekranı için (ara yol parçası olduğundan) **"şunu içerir"** kuralı:

```
/konu/
```

**Kodda ikinci bir güvenlik katmanı var.** `src/lib/otomatikReklam.js`, bu
rotalarda Google'ın otomatik yerleştirdiği kapsayıcıları DOM'dan kaldırır.
Neden gerekli: site bir SPA; kullanıcı ana sayfadan oyuna geçtiğinde tarayıcı
yeni sayfa yüklemez, dolayısıyla panelin URL hariç tutması her geçişte
devreye girmez (özellikle çapa reklamı sayfa geçişlerinde ekranda kalır).

Kural listesini değiştirmek istersen tek yer:

```js
// src/lib/otomatikReklam.js
export const YASAKLI_ROTALAR = [
  /^\/oyun\//,
  /^\/quiz\/oyna\/?$/,
  /^\/deneme\//,
  /^\/ders\/[^/]+\/konu\//,
  /^\/kartlar\/[^/]+/,
]
```

Katmanı tamamen kapatmak için aynı dosyada `OTOMATIK_REKLAM_ENGELI = false`.

> Not: otomatik reklamların **sayfa içi** yerleşimleri SPA'da yalnızca ilk
> yüklemede taranır; istemci tarafı rota geçişlerinde yeniden yerleştirme
> yapılmaz. Bu yüzden ana sayfa / ders listesi / sonuç ekranı gibi kritik
> yerlerde manuel birimler (§ 4) hâlâ gerekli — asıl geliri onlar taşıyacak.

---

## 4. Manuel reklam birimleri

AdSense → **Reklamlar → Reklam birimine göre → Görüntülü reklam**

Dört birim oluştur (adları serbest, önerilenler):

| Birim adı | Nerede görünecek |
|---|---|
| `kpss-ana-sayfa` | Ana sayfada ders listesinin altında |
| `kpss-ders-listesi` | Dersler sayfasının altında |
| `kpss-sonuc` | Quiz ve deneme sonuç ekranlarında |
| `kpss-rehber` | Statik rehber sayfalarında (`/kpss-nedir` vb.) |

Her birim sana bir **slot kimliği** verir (10 haneli sayı). Bunları
`src/lib/reklam.js` içine yapıştır:

```js
export const SLOTLAR = {
  anaSayfa: '1234567890',
  dersListesi: '2345678901',
  sonuc: '3456789012',
  rehber: '4567890123',
}
```

Sonra `npm run build` + `git push`. Kimlik girilmeyen yerde **hiçbir şey render
edilmez** — boşluk bile kalmaz, yani kimlikleri sırayla ekleyebilirsin.

Reklamın **konmadığı** yerler (bilinçli):

- Tüm oyun ekranları (Harita Avcısı, Kronoloji, Eşleştirme, Doğru mu?, Maraton)
- Soru çözme sırasında (şıkların yanında reklam = yanlış tıklama riski)
- Deneme sınavı sürerken (yalnızca sonuç ekranında)
- Bilgi kartları çevrilirken

---

## 5. Çerez izni ve Consent Mode

`index.html` içinde Google Consent Mode v2 **varsayılan olarak reddedilmiş**
durumda başlatılıyor; kullanıcı seçim yapınca güncelleniyor.

Bildirim metni gerçeği söylüyor: **reddetmek reklamları kaldırmaz**, yalnızca
kişiselleştirmeyi kapatır. Bu yüzden butonlar "Kabul et / Reddet" değil,
"İzin ver / Kişiselleştirme istemiyorum".

Kullanıcı tercihini `/gizlilik` sayfasından değiştirebiliyor.

> Manuel birimler kullanıcı seçim yapana kadar hiç yüklenmez. Otomatik
> reklamlar Google'ın kendi akışıyla çalışır ve Consent Mode sinyaline uyar
> (izin yoksa kişiselleştirilmemiş reklam gösterir).

> **AB trafiği için not:** Avrupa Ekonomik Alanı ve Birleşik Krallık
> kullanıcılarına reklam gösterecekseniz Google, **sertifikalı bir CMP**
> kullanılmasını şart koşuyor. Buradaki bildirim kendi yazdığımız basit bir
> çözüm; Türkiye ağırlıklı trafik için yeterli. AB trafiği anlamlı düzeye
> çıkarsa AdSense panelindeki **Gizlilik ve mesajlaşma → GDPR mesajı**
> özelliğini açman gerekir (ücretsiz, Google'ın kendi CMP'si).

---

## 6. ads.txt

`public/ads.txt` hazır:

```
google.com, pub-6166144150941943, DIRECT, f08c47fec0942fa0
```

`https://kpssakademi.tr/ads.txt` adresinden erişilebilir olmalı. AdSense bunu
kontrol eder; eksikse panelde uyarı çıkar.

---

## 7. Kontrol listesi

- [x] Site canlı ve içerik dolu
- [x] `/gizlilik` sayfası reklam ve çerez maddelerini içeriyor
- [x] `/iletisim` sayfası var — AdSense incelemesinde aranır
- [x] `ads.txt` erişilebilir
- [x] Sitede "reklamsız" iddiası yok
- [x] Otomatik reklam engeli oyun/soru/sınav rotalarında kodda hazır
- [ ] AdSense onayı geldi
- [ ] Otomatik reklamlar panelden açıldı (vinyet kapalı)
- [ ] Sayfa hariç tutmaları girildi (§ 3)
- [ ] Reklam birimi kimlikleri `src/lib/reklam.js` içine girildi

---

## 8. Onay geldikten sonra test

1. Ana sayfayı aç, çerez bildiriminde **İzin ver** de → sayfa içi / çapa
   reklamı görünmeli.
2. Alt menüden **Oyunlar → herhangi bir oyun** → hiçbir reklam kalmamalı,
   çapa reklamı da kaybolmalı.
3. Geri dön → ana sayfada reklam yeniden görünmeli.
4. Bir quiz çöz → çözerken reklam yok, **sonuç ekranında** manuel birim var.

Reklam görünmüyorsa sırayla bak: onay durumu → reklam engelleyici eklenti →
tarayıcı konsolunda `adsbygoogle` hatası → panelde birim "etkin" mi.
