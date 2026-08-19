# AdSense kurulumu — kpssakademi.tr

Yayıncı hesabın zaten var: **pub-6166144150941943** (AdMob ile aynı hesap).
Yeni başvuru yapmana gerek yok, siteyi mevcut hesaba eklemen yeterli.

---

## 1. Siteyi AdSense'e ekle

[adsense.google.com](https://adsense.google.com) → **Siteler** → **Site ekle** → `kpssakademi.tr`

**Doğrulama yöntemi olarak META ETİKET'i seç.** Etiket zaten `index.html` içinde:

```html
<meta name="google-adsense-account" content="ca-pub-6166144150941943" />
```

> mmcep.com'da kod snippet'i yöntemi başarısız olmuştu (script sonradan
> yüklendiği için Google'ın robotu kaynakta göremedi), meta etiket geçmişti.
> Burada da meta etiketle git.

Site incelemesi genelde birkaç gün sürer. İnceleme sırasında site canlı ve
içerik dolu olmalı — bu yüzden **önce yayına al, sonra ekle**.

---

## 2. Reklam birimlerini oluştur ve kimliklerini gir

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

---

## 3. Neden otomatik reklam değil?

mmcep.com'da otomatik reklamlar kullanıldı çünkü orada her sayfa aynı türde.
Burada **oyunlarda reklam olmayacak** kuralı var ve otomatik reklamlarda
yerleşimi Google belirlediği için bu garanti edilemez. Bu yüzden manuel
yerleşim seçildi.

Reklamın **konmadığı** yerler (bilinçli):

- Tüm oyun ekranları (Harita Avcısı, Kronoloji, Eşleştirme, Doğru mu?, Maraton)
- Soru çözme sırasında (şıkların yanında reklam = yanlış tıklama riski)
- Deneme sınavı sürerken (yalnızca sonuç ekranında)
- Bilgi kartları çevrilirken

Yine de otomatik reklamları denemek istersen AdSense panelinden açabilirsin;
o durumda oyun sayfalarında da reklam çıkar.

---

## 4. Çerez izni ve Consent Mode

`index.html` içinde Google Consent Mode v2 **varsayılan olarak reddedilmiş**
durumda başlatılıyor; kullanıcı seçim yapınca güncelleniyor.

Bildirim metni gerçeği söylüyor: **reddetmek reklamları kaldırmaz**, yalnızca
kişiselleştirmeyi kapatır. Bu yüzden butonlar "Kabul et / Reddet" değil,
"İzin ver / Kişiselleştirme istemiyorum".

Kullanıcı tercihini `/gizlilik` sayfasından değiştirebiliyor.

> **AB trafiği için not:** Avrupa Ekonomik Alanı ve Birleşik Krallık
> kullanıcılarına reklam gösterecekseniz Google, **sertifikalı bir CMP**
> kullanılmasını şart koşuyor. Buradaki bildirim kendi yazdığımız basit bir
> çözüm; Türkiye ağırlıklı trafik için yeterli. AB trafiği anlamlı düzeye
> çıkarsa AdSense panelindeki **Gizlilik ve mesajlaşma → GDPR mesajı**
> özelliğini açman gerekir (ücretsiz, Google'ın kendi CMP'si).

---

## 5. ads.txt

`public/ads.txt` hazır:

```
google.com, pub-6166144150941943, DIRECT, f08c47fec0942fa0
```

Yayına alındıktan sonra `https://kpssakademi.tr/ads.txt` adresinden erişilebilir
olmalı. AdSense bunu kontrol eder; eksikse panelde uyarı çıkar.

---

## 6. Yayın öncesi kontrol listesi

- [ ] Site canlı ve içerik dolu (gerçek sorular aktarılmış)
- [ ] `/gizlilik` sayfası reklam ve çerez maddelerini içeriyor ✔ (hazır)
- [ ] `/iletisim` sayfası var ✔ (hazır) — AdSense incelemesinde aranır
- [ ] `ads.txt` erişilebilir ✔ (hazır)
- [ ] Sitede "reklamsız" iddiası kalmamış ✔ (temizlendi)
- [ ] Reklam birimi kimlikleri `src/lib/reklam.js` içine girilmiş
