# -*- coding: utf-8 -*-
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fab

K = fab.kontrol

# 423 zaten 9'a bolunuyordu (gerekli ek 9, sikta yok). 429 yapildi -> gerekli ek 3.
K('matematik', 100131, 3,
  "Bir sayının 9'a bölünebilmesi için rakamları toplamının 9'un katı olması gerekir. 429 sayısının rakamları toplamı 4 + 2 + 9 = 15'tir ve 15'in 9'a bölümünden kalan 6'dır. Toplamı bir sonraki 9 katına (18'e) ulaştırmak için 3 eklenmelidir. Gerçekten 429 + 3 = 432 ve 4 + 3 + 2 = 9 olduğundan 432 sayısı 9'a tam bölünür. Doğru yanıt A) 3'tür.",
  soru="429 sayısına en az kaç eklenirse elde edilen sayı 9'a bölünebilir?")

# Carpim 1680 ile ardisik dort cift sayi bulunamiyordu; 1920 yapildi (4·6·8·10).
K('matematik', 100149, 28,
  "Ardışık dört çift sayı a, a + 2, a + 4, a + 6 biçiminde yazılır. Çarpımları 1920 olduğuna göre denenerek 4 × 6 × 8 × 10 = 1920 bulunur. Bu sayıların toplamı 4 + 6 + 8 + 10 = 28'dir. Doğru yanıt A) 28'dir.",
  soru="Ardışık dört çift sayının çarpımı 1920 olduğuna göre bu sayıların toplamı kaçtır?")

# 5AB3 sayisi 4'e asla bolunemez (son iki basamak tek); son rakam 2 yapildi.
K('matematik', 100153, 6,
  "Sayının 4'e bölünebilmesi için son iki basamağının oluşturduğu 10B + 2 sayısının 4'e bölünmesi gerekir; bu da B'nin tek olmasını gerektirir: B ∈ {1, 3, 5, 7, 9}. Sayının 3'e bölünebilmesi için rakamları toplamı 5 + A + B + 2 = A + B + 7 ifadesinin 3'ün katı olması gerekir; buradan A + B ≡ 2 (mod 3) çıkar. İki koşulu birlikte sağlayan A ve B değerleri tarandığında A + B toplamı 2, 5, 8, 11, 14 ve 17 değerlerini alabilir. Böylece 6 farklı değer elde edilir. Doğru yanıt E) 6'dır.",
  soru="Dört basamaklı 5AB2 sayısı hem 3'e hem de 4'e tam bölünebiliyorsa, A + B'nin alabileceği farklı değerlerin sayısı kaçtır?")

# Bolen sayisi 24 iken a+b hem 5 hem 6 olabiliyordu (iki dogru yanit). 50 yapildi -> tek sonuc 8.
K('matematik', 100163, 8,
  "N = 2^a × 3^b × 5 sayısının pozitif bölen sayısı (a + 1)(b + 1)(1 + 1) çarpımına eşittir. Bölen sayısı 50 olduğuna göre (a + 1)(b + 1) × 2 = 50 → (a + 1)(b + 1) = 25 yazılır. 25 sayısının her iki çarpanı da en az 2 olacak biçimde tek ayrışımı 5 × 5'tir; buradan a + 1 = 5 ve b + 1 = 5 → a = 4, b = 4 bulunur. Buna göre a + b = 8'dir. Doğru yanıt D) 8'dir.",
  soru="N = 2^a × 3^b × 5 sayısının tam bölen sayısı 50 ise a + b toplamı kaçtır?")

# A4B2 kalibinda A+B degerleri {3,12}, toplam 15 (sikta yok). Son rakam 8 yapildi -> {6,15}, toplam 21.
K('matematik', 100180, 21,
  "18 = 2 × 9 olduğundan sayının hem 2'ye hem de 9'a bölünmesi gerekir. Son basamak 8 olduğundan 2'ye bölünme koşulu sağlanmıştır. 9'a bölünme için rakamlar toplamı A + 4 + B + 8 = A + B + 12 ifadesinin 9'un katı olması gerekir. A en az 1, A + B en çok 18 olduğundan A + B değeri 6 ya da 15 olabilir; her ikisi de uygun rakam seçimleriyle elde edilir. Bu değerlerin toplamı 6 + 15 = 21'dir. Doğru yanıt B) 21'dir.",
  soru="Dört basamaklı 'A4B8' sayısı 18'e bölünebiliyorsa A + B'nin alabileceği değerler toplamı nedir?")

# Hesaplanan toplam 13608 hicbir sikta yoktu; C sikki dogru degere cevrildi.
K('matematik', 100183, 13608,
  "Bir sayının hem 12'nin hem de 18'in katı olması için EKOK(12, 18) = 36'nın katı olması gerekir. 1000'den küçük 36'nın katları 36, 72, …, 972 olup bu bir aritmetik dizidir ve terim sayısı 972 ÷ 36 = 27'dir. Toplam, 27 × (36 + 972) ÷ 2 = 27 × 504 = 13608 olarak bulunur. Doğru yanıt C) 13608'dir.",
  secenekler=["14256", "13572", "13608", "13284", "14994"])

# 7k+3 icin k ≡ 9 (sikta yok); sabit 5 yapildi -> k ≡ 4.
K('matematik', 100192, 4,
  "7k + 5 ≡ 0 (mod 11) koşulundan 7k ≡ −5 ≡ 6 (mod 11) elde edilir. 7 × 8 = 56 = 5 × 11 + 1 olduğundan 7'nin mod 11'deki çarpmaya göre tersi 8'dir. Her iki yan 8 ile çarpıldığında k ≡ 48 ≡ 4 (mod 11) bulunur. Doğrulama: k = 4 için 7 × 4 + 5 = 33 = 3 × 11. Doğru yanıt B) 4'tür.",
  soru="k pozitif tam sayı olmak üzere, 7k + 5 ifadesinin 11'e bölünebilmesi için k'nın 11'e göre kalanı kaçtır?")

# 5 ve 11 ikisi de hic bolemiyordu (iki dogru yanit). 11 yerine 31 konuldu (m=5 icin boler).
K('matematik', 100200, 5,
  "m² + m + 1 ifadesinin bir p asalına bölünebilmesi, m² + m + 1 ≡ 0 (mod p) denkleminin çözümü olmasına bağlıdır. Tarama yapıldığında 3 için m ≡ 1, 7 için m ≡ 2 ve 4, 13 için m ≡ 3 ve 9, 31 için ise m ≡ 5 ve 25 değerleri denklemi sağlar; yani bu sayılar ifadeyi bölebilir. 5 için ise hiçbir m değeri denklemi sağlamaz: m'nin 5 ile bölümünden kalanı 0, 1, 2, 3, 4 alındığında ifade sırasıyla 1, 3, 2, 3, 1 kalanını verir ve hiçbiri 0 değildir. Doğru yanıt B) 5'tir.",
  secenekler=["31", "5", "3", "13", "7"])

# 360 icin en kucuk a·b = 30 (sikta yok). 144 yapildi -> 12.
K('matematik', 100202, 12,
  "144 = 2⁴ × 3² olarak asal çarpanlara ayrılır. a² × b³ çarpımının 144'e bölünebilmesi için bu çarpımda en az 2⁴ ve 3² bulunmalıdır. a ile b'nin küçük değerleri tarandığında b = 12 ve a = 1 seçimiyle a² × b³ = 1728 elde edilir; 1728 ÷ 144 = 12 olduğundan koşul sağlanır ve a × b = 12 olur. Daha küçük bir a × b çarpımı koşulu sağlamadığından aranan en küçük değer 12'dir. Doğru yanıt E) 12'dir.",
  soru="a ve b pozitif tam sayılar olmak üzere, a²·b³ sayısının 144'e bölünebilmesi için a·b çarpımının alabileceği en küçük değer kaçtır?")

# 8 ve 9'a bolunenlerde farkli rakam toplami 2 idi (sikta yok). 11 ve 12 yapildi -> 4.
K('matematik', 100204, 4,
  "Bir sayının hem 11'e hem de 12'ye bölünebilmesi için EKOK(11, 12) = 132'nin katı olması gerekir. Üç basamaklı 132 katları 132, 264, 396, 528, 660, 792 ve 924'tür. Bu sayıların rakamları toplamı sırasıyla 6, 12, 18, 15, 12, 18 ve 15 olarak bulunur. Birbirinden farklı değerler 6, 12, 15 ve 18 olmak üzere 4 tanedir. Doğru yanıt C) 4'tür.",
  soru="Üç basamaklı bir ABC sayısı hem 11'e hem de 12'ye bölünebilmektedir. A+B+C toplamının alabileceği farklı değerlerin sayısı kaçtır?")

fab.yaz()
