# Soru Araçları

İki ayrı araç var. İkisi de Python 3 ile çalışır, proje kökünden bağımsızdır
(yolları kendiliğinden bulur). `denetim` için ek paket gerekmez; `cozucu.py`
içindeki denklem çözücüyü kullanacaksan `pip install sympy` gerekir.

---

## 1) `denetim/` — Kontrol fabrikası (mevcut soruları denetler ve düzeltir)

### Ne işe yarar
Soru bankasındaki kusurlu soruları bulur, doğru cevabı **kesin hesapla**
çıkarır ve düzeltmeyi güvenlik denetimlerinden geçirerek yazar.

### Komutlar

    python3 denetim/denetim.py durum              # genel ilerleme tablosu
    python3 denetim/denetim.py liste matematik    # sırada bekleyen sorular
    python3 denetim/denetim.py dok matematik 10   # 10 soruyu tam metinle döker
    python3 denetim/kompakt.py matematik 10       # aynısının kısa (ucuz) hâli
    python3 denetim/ayikla.py                     # açıklamadan cevap adayı çıkarır

`defter.json` hangi sorunun incelendiğini tutar; iş kaldığı yerden sürer.

### Düzeltme yazarken

`denetim/ornek-parti-matematik.py` dosyasına bak. Kalıp şu:

    import fab
    fab.kontrol('matematik', 100131, 3, "Açıklama...", soru="Yeni soru kökü...")
    fab.yaz()

Üçüncü değer **kesin hesaplanmış doğru sonuç**. Fabrika bu değeri şıklarla
eşleştirip anahtarı kendisi belirler ve şunları reddeder:

- sonuç hiçbir şıkla eşleşmiyorsa (soru kökü düzeltilmeli demektir)
- sonuç birden fazla şıkla eşleşiyorsa (mükerrer şık)
- açıklamada taslak metin, `answer:` kod sızıntısı veya bozuk cümle varsa

### Çözücü yardımcıları (`cozucu.py`)

    ebob(12,18) / ekok(4,6)
    coz(['a+b-40','a-b-8'], 'a b')            -> {'a':24,'b':16}
    rakam_ara('3A47B', kosul, deger)          -> rakam yerleştirme taraması
    permutasyon_say([1,2,3,4,5], kosul)
    aralik_say(1, 200, kosul)
    hedefe_ayarla(adaylar, hesap, siklar)     -> soru kökündeki sayıyı,
                                                 mevcut bir şık doğru çıkacak
                                                 biçimde arar
    sik_degerleri(secenekler)                 -> şıkları sayıya çevirir

---

## 2) `uretim/` — Soru fabrikası (yeni soru ekler)

### Komut

    python3 uretim/fabrika.py <ders> <parti.py>          # yalnızca doğrula
    python3 uretim/fabrika.py <ders> <parti.py> --yaz    # doğrula ve ekle

### Parti dosyası biçimi

`SABLON.py` ve `uretim/ornek-parti-kamuyonetimi.py` dosyalarına bak
(bu örnek parti bankaya zaten eklendiği için yeniden çalıştırılırsa
"soru bankada zaten var" uyarısı verir; biçimi göstermek için duruyor).
Her soru:

    ("konuId", "zor", "Soru kökü ...?",
     ["A", "B", "C", "D", "E"], 2, "Açıklama ...")

İsteğe bağlı 7. alan `True` ise doğru şıkkın en uzun olmasına izin verilir
(doğal varyasyon). Bir partide bu oran %35'i geçemez.

### Otomatik denetimler

1. Şema: alanlar dolu, 5 şık, geçerli doğru indeksi, zorluk kolay/orta/zor
2. `konuId` dersin mevcut konu listesinde olmalı
3. Aynı şık tekrarı yok
4. Soru metni bankada zaten bulunmamalı
5. **Doğru şık en uzun olmamalı** (cevap uzunluğu sızıntısı kuralı)
6. Bozuk cümle birleşimi yok (`... . ve ...`)
7. Açıklama en az 40 karakter
8. Id'ler bankanın devamı olarak otomatik atanır

Hata varsa dosyaya hiç yazmaz.

## 3) Otomatik denetim — `denetim/otomatik.py`

Kusurlu soruları kendi başına sınıflar ve **yalnızca kanıtın kesin olduğu**
durumlarda düzeltir. Açıklamanın iddia ettiği harf veya `answer:N` değerine
GÜVENMEZ — bunların bankada sık sık yanlış olduğu ölçüldü. Tek güvenilen
kanıt, açıklamanın kendi hesabının sonucu ile şıkların eşleşmesidir.

```
python tools\soru-araclari\denetim\otomatik.py rapor     # hiçbir şey yazmaz
python tools\soru-araclari\denetim\otomatik.py uygula    # güvenli olanları yazar
```

Kararlar:

| karar | ne yapar |
|---|---|
| `YANLIS-ALARM` | İtiraf kalıbı aslında konunun kendisini anlatıyor (ör. "nedensellik zincirinin hatalı kurgulanmış olması"). Soru sağlam; dosya değişmez, deftere "sorun yok" yazılır. |
| `DEGER` | Açıklamanın sonuç bölgesindeki değer tam olarak bir şıkka eşleşiyor. Anahtar o şıkka alınır, açıklamanın sonundaki taslak cümleleri atılır ve tek temiz sonuç cümlesi eklenir. |
| `KOD-TEMIZ` | Anahtar zaten doğru; açıklamada yalnızca `answer:N` gibi teknik kuyruk kalmış. Anahtar değişmez, kuyruk temizlenir. |
| `BOZUK` | Açıklama kendi hesabının hiçbir şıkla eşleşmediğini söylüyor, iki sonuç arasında gidip geliyor ya da soruyu değiştirerek cevaplamış. **Dokunulmaz**, elle yazılmalı. |

Güvenlik kuralları (bilerek konuldu):

- Cümle içinde regex ile onarım **yapılmaz**. Gövdeye dokunulmaz; yalnızca
  sondaki taslak cümleler atılır ve yerine tek bir temiz sonuç cümlesi gelir.
  (Daha önce cümle içi mekanik düzeltme 288 bozuk şık üretti.)
- Gövde temizlikten sonra 60 karakterin altına düşerse soru elle listesine
  bırakılır.
- Sayısal sonuç ile şık metni farklı şıkları gösteriyorsa karar verilmez.
