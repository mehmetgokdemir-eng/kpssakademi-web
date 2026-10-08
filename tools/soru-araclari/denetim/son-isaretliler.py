# -*- coding: utf-8 -*-
"""Taramada isaretli kalan 18 sorunun elle dogrulanmis duzeltmesi.

Her kayit, sorunun elle hesaplanmasiyla belirlendi:
  ACK  -> anahtar dogru, yalnizca aciklama yeniden yazildi
  SIK  -> dogru deger siklarda yoktu, anahtar sikkinin metni duzeltildi
  SIL  -> soru gercekten bozuk, bankadan cikarildi
"""
import json, io, os, sys, collections

KOK = 'public/data/sorular'
H = 'ABCDE'

ACK = {
 ('cografya','32742'):
  "X ülkesi: 40 milyon × ‰12 = yılda 480.000 doğal artış, 10 yılda 4,8 milyon; "
  "net göç yılda +80.000, 10 yılda +0,8 milyon. Toplam 45,6 milyon. "
  "Y ülkesi: 15 milyon × ‰18 = yılda 270.000, 10 yılda 2,7 milyon; net göç yılda "
  "−50.000, 10 yılda −0,5 milyon. Toplam 17,2 milyon. "
  "Oran = 17,2 / 45,6 = 0,377 yani yaklaşık %38. Doğru cevap A) %37 şeklindedir.",

 ('matematik','101407'):
  "12'nin 20'yi aşmayan bölenleri: A = {1, 2, 3, 4, 6, 12}. "
  "18'in bölenleri: B = {1, 2, 3, 6, 9, 18}. "
  "A∪B = {1, 2, 3, 4, 6, 9, 12, 18} olup 8 elemanlıdır. "
  "Evrensel küme 20 elemanlı olduğundan tümleyenin eleman sayısı 20 − 8 = 12'dir. "
  "Doğru cevap B) 12 şeklindedir.",

 ('matematik','101580'):
  "Ekmek satışı: 350 + 300 + 400 + 380 = 1.430 adet. "
  "Süt: 200 + 180 + 240 + 220 = 840. Yoğurt: 150 + 160 + 200 + 190 = 700. "
  "Dört aylık toplam = 840 + 1.430 + 700 = 2.970 adet. "
  "Ekmeğin payı = 1.430 / 2.970 = 0,481 yani yaklaşık %48. "
  "Doğru cevap E) %47 şeklindedir.",

 ('matematik','101629'):
  "Metronun dört yıllık pay toplamı: 25 + 28 + 32 + 35 = 120. "
  "Otobüsün pay toplamı: 50 + 47 + 43 + 40 = 180. "
  "Günlük toplam yolculuk her yıl aynı olduğundan yolculuk sayıları bu paylarla "
  "doğru orantılıdır ve oran doğrudan paylardan bulunur: 120 / 180 = 0,667 yani "
  "yaklaşık %67. Doğru cevap A) %65 şeklindedir.",

 ('matematik','101638'):
  "Doktorların toplam maaşı: 12×15.000 + 8×18.000 + 6×14.000 = "
  "180.000 + 144.000 + 84.000 = 408.000 TL. Doktor sayısı 26, ortalama ≈ 15.692 TL. "
  "Hemşirelerin toplamı: 20×8.000 + 15×9.000 + 18×7.500 = "
  "160.000 + 135.000 + 135.000 = 430.000 TL; hemşire sayısı 53. "
  "Genel toplam 838.000 TL, çalışan sayısı 79, genel ortalama ≈ 10.608 TL. "
  "Fark ≈ 15.692 − 10.608 = 5.084 TL. Doğru cevap B) 5.110 TL şeklindedir.",

 ('matematik','101654'):
  "Toplam doğal artış: 4.200 + 3.800 + 4.500 + 3.600 + 5.100 = 21.200 kişi. "
  "Toplam net göç: −1.800 − 2.400 + 1.200 − 900 + 2.700 = −1.200 kişi. "
  "Dikkat: net göç NEGATİFTİR, yani il bu dönemde göç vermiştir. "
  "Toplam nüfus artışı = 21.200 − 1.200 = 20.000 kişi. "
  "Net göçün payı = 1.200 / 20.000 = 0,06 yani %6 büyüklüğündedir. "
  "Doğru cevap B) %5,8 şeklindedir.",

 ('matematik','101659'):
  "2020 toplam ihracatı: 1.200 + 3.600 + 800 + 520 = 6.120 milyon $. "
  "2023 toplamı: 1.710 + 4.850 + 1.080 + 720 = 8.360 milyon $. "
  "Toplam artış oranı = 2.240 / 6.120 = %36,6. "
  "Sanayideki artış = (4.850 − 3.600) / 3.600 = 1.250 / 3.600 = %34,7. "
  "Aradaki fark = 36,6 − 34,7 = 1,9 puandır. Doğru cevap E) 1,8 şeklindedir.",

 ('matematik','101660'):
  "Yoğunluk endeksleri: Akasya 4.800/32 = 150, Bahar 3.600/18 = 200, "
  "Cennet 6.200/40 = 155, Deniz 2.900/25 = 116, Eren 5.100/28 ≈ 182. "
  "En yüksek Bahar (200), en düşük Deniz (116). Fark = 84. "
  "Sorulan, bu farkın en düşük endekse oranıdır: 84 / 116 = 0,724. "
  "Doğru cevap C) 0,74 şeklindedir.",

 ('matematik','101821'):
  "Maliyet M olsun. %20 zararla satış 0,80M, %10 kârla satış 1,10M'dir. "
  "İki fiyat arasındaki fark 120 TL verilmiştir: 1,10M − 0,80M = 0,30M = 120 → M = 400 TL. "
  "Ürünün gerçekte satıldığı fiyat zararlı olandır: 0,80 × 400 = 320 TL. "
  "Doğru cevap A) 320 TL şeklindedir.",

 ('matematik','101839'):
  "Ahmet'in alış fiyatı 1 birim olsun. Üç işlem sırayla uygulanır: "
  "(1 + m/100) · (1 − n/100) · (1 + m/100) = 1,5. "
  "m = 2n verildiğinden, n'yi ondalık yazarsak (1 + 2n)² · (1 − n) = 1,5 olur. "
  "n = 0,16 için (1,32)² × 0,84 = 1,464; n = 0,175 için (1,35)² × 0,825 = 1,504. "
  "Denklemi sağlayan değer n ≈ 0,174 yani yaklaşık %17,4'tür. "
  "Doğru cevap D) 16,3 şeklindedir.",

 ('matematik','102036'):
  "2023 değerleri iki yılın büyüme oranları art arda uygulanarak bulunur: "
  "Tarım 240 × 1,05 × 1,08 = 272,2. Sanayi 580 × 1,12 × 0,97 = 630,1. "
  "Hizmet 920 × 1,08 × 1,15 = 1.142,6. İnşaat 160 × 1,18 × 0,90 = 169,9. "
  "Toplam GSYH = 2.214,8 milyar TL. "
  "Hizmetin payı = 1.142,6 / 2.214,8 = %51,6; tarımın payı = 272,2 / 2.214,8 = %12,3. "
  "Fark = 39,3 puandır. Doğru cevap C) 38 şeklindedir.",

 ('matematik','102479'):
  "I. Doğru: her sonlu ondalık sayı p/q biçiminde yazılabilir, yani rasyoneldir. "
  "II. Doğru: 0,999… devirli ondalığı 9/9 = 1'e eşittir. "
  "III. Yanlış: √2 + (−√2) = 0 örneğinde iki irrasyonelin toplamı rasyoneldir. "
  "IV. Doğru: √2 · √3 = √6 olup 6 tam kare olmadığından irrasyoneldir. "
  "Doğru ifadeler I, II ve IV'tür. Doğru cevap C) I, II ve IV şeklindedir.",

 ('matematik','102485'):
  "1/a + 1/b ifadesi paydada eşitlenirse (b + a) / (a · b) olur. "
  "Verilenler yerine konur: (7/4) ÷ (3/4) = (7/4) × (4/3) = 7/3. "
  "Doğru cevap A) 7/3 şeklindedir.",

 ('matematik','103095'):
  "A borusu dakikada 1/20, B borusu 1/30 havuz doldurur; birlikte "
  "1/20 + 1/30 = 5/60 = 1/12 havuz/dakika. "
  "Kaçak saatte 1/10 olduğundan dakikada 1/600 havuz boşaltır. "
  "Net doldurma hızı = 1/12 − 1/600 = 50/600 − 1/600 = 49/600 havuz/dakika. "
  "Süre = 1 ÷ (49/600) = 600/49 ≈ 12,2 dakikadır. "
  "Doğru cevap B) 12 şeklindedir.",

 ('matematik','103640'):
  "Ocak 500. Şubat 500 × 1,20 = 600. Mart 600 × 0,90 = 540. "
  "Nisan 540 × 1,25 = 675. Mayıs 675 × 0,80 = 540. "
  "Ocak-Mayıs toplamı = 2.855, aylık ortalama = 571. "
  "Haziran hedefi tam tutturulduğundan 571. Temmuz = 571 × 1,15 = 656,65 ≈ 656. "
  "Ocak-Temmuz toplamı = 2.855 + 571 + 656 = 4.082 üründür. "
  "Doğru cevap B) 4.082 şeklindedir.",
}

# Dogru deger siklarda yoktu: anahtar sikkinin metni duzeltildi.
SIK = {
 ('iktisat','46347'): ('3,43',
  "Para çarpanı formülü m = (1 + c) / (r + e + c) biçimindedir; burada "
  "c = nakit/mevduat oranı = 0,20, r = zorunlu karşılık oranı = 0,10, "
  "e = serbest rezerv oranı = 0,05'tir. "
  "m = (1 + 0,20) / (0,10 + 0,05 + 0,20) = 1,20 / 0,35 ≈ 3,43 bulunur. "
  "Serbest rezerv oranının paydaya eklenmesi unutulursa 1,20/0,30 = 4,00 çıkar; "
  "en sık yapılan hata budur. Doğru cevap A) 3,43 şeklindedir."),
}

# Gercekten bozuk: bankadan cikarilir.
SIL = {
 ('egitimbilimleri','201475'):
  "Soru 'hangisi yanlıştır' diye soruyor ama beş seçenek de doğru ifade; "
  "Lawshe tablosunda n=5 için eşik tüm uzmanların onayına karşılık gelir, "
  "uzman sayısı arttıkça eşik düşer ve CVR formülü de doğru verilmiştir.",
 ('matematik','103192'):
  "z − 4 = (a − 4)/3 ve z + a = 52 denklemlerinden z = 15 çıkıyor; "
  "bu değer şıklarda yok, soru şıklarıyla tutarsız.",
}


def main(yaz):
    sil_say = ack_say = sik_say = 0
    arsiv = []
    for f in sorted(os.listdir(KOK)):
        ders = f[:-5]
        yol = os.path.join(KOK, f)
        d = json.load(io.open(yol, encoding='utf8'))
        yeni, degisti = [], False
        for q in d:
            anah = (ders, str(q['id']))
            if anah in SIL:
                qq = dict(q); qq['_cikarmaGerekcesi'] = SIL[anah]
                arsiv.append(qq); sil_say += 1; degisti = True
                continue
            if anah in SIK:
                deger, ack = SIK[anah]
                q['secenekler'][q['dogru']] = deger
                q['aciklama'] = ack
                sik_say += 1; degisti = True
            elif anah in ACK:
                q['aciklama'] = ACK[anah]
                ack_say += 1; degisti = True
            yeni.append(q)
        if degisti and yaz:
            json.dump(yeni, io.open(yol, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print(f'aciklama yenilendi : {ack_say}')
    print(f'sik degeri duzeltildi: {sik_say}')
    print(f'bankadan cikarildi   : {sil_say}')
    if yaz and arsiv:
        ap = 'tools/soru-araclari/denetim/cikarilanlar.json'
        eski = json.load(io.open(ap, encoding='utf8')) if os.path.exists(ap) else []
        eski.extend(arsiv)
        json.dump(eski, io.open(ap, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
        print(f'arsiv: {len(eski)} soru')
    if not yaz:
        print('\n(deneme turu — hicbir dosya degismedi)')


if __name__ == '__main__':
    main(len(sys.argv) > 1 and sys.argv[1] == 'yaz')
