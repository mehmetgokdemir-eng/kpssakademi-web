# -*- coding: utf-8 -*-
"""Arsivdeki (cikarilanlar.json) 62 sik-onarim adayinin ELLE DOGRULANMIS sonucu.

Her aday tek tek hesaplandi. Kabul olcutleri (ikisi birden saglanmali):
  1. Gerekcedeki deger, sorunun gercek cevabi olmali (araç bazen ara degeri
     cevap sanmisti — o kayitlarda deger duzeltildi ya da aday reddedildi).
  2. Yeni deger, kalan dort sikkin olusturdugu kumenin icinde ya da ona
     yakin olmali ve ayni bicimde yazilmali. Aksi halde dogru cevap hesap
     yapilmadan ayirt edilir; soru ise yaramaz.
Ayrica gercekdisi sonuc (16 yasinda anne), celiskili soru metni ve
birden fazla okunusu olan sorular reddedildi.

  python3 arsivden-geri.py          -> deneme turu
  python3 arsivden-geri.py yaz      -> uygular
"""
import json, io, os, sys, collections

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import denetim, sikonar

KOK = denetim.KOK
VERI = os.path.abspath(os.path.join(KOK, '..'))
MANIFEST = os.path.join(VERI, 'index.json')
ARSIV = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cikarilanlar.json')
H = 'ABCDE'

# --- bankaya geri alinanlar: (ders, id) -> anahtar sikkinin yeni metni ---
KABUL = {
 ('cografya','32044'): '05.12',   # 102 derece = 6 sa 48 dk, 12.00 - 6.48 = 05.12
 ('hukuk','44018'): '120',        # Anayasa m.93: 600'un beste biri
 ('matematik','100068'): '13',    # B=5, A=8 -> A+B=13
 ('matematik','100109'): '180',   # 97x83=8051 (rakam toplami 14) -> 97+83
 ('matematik','100358'): '720',   # a=20, b=36
 ('matematik','100416'): '36',    # kalan 2/9 = 8 ogrenci
 ('matematik','100538'): '117/118',
 ('matematik','100765'): '3/4',   # 0,20x = 0,15y
 ('matematik','101268'): '13',    # x=5, k=13
 ('matematik','101304'): '58',    # p4+p3-p2 = 47+18-7
 ('matematik','101389'): '13',    # |A|+|B|=30, |B|=|A|+4
 ('matematik','101417'): '54',    # icerme-disarma
 ('matematik','101430'): '14',    # 8+5+3-1-1-1+1
 ('matematik','101522'): '5/7',   # 1 - 24/84  (arac 10/14 demisti; sadeleştirildi)
 ('matematik','101588'): '%86,5', # 173.000/200.000
 ('matematik','101698'): '165',   # 33 sayi, 11'e gore 3 tam devir -> 3x55
 ('matematik','101861'): '3000',  # v=15, L=200
 ('matematik','101940'): '31',    # 5 yil once 13 ve 26
 ('matematik','101947'): '20',    # 3x+6 = 2x+26
 ('matematik','101956'): '7',     # e1=1, e2=-1, e3=1
 ('matematik','101957'): '-2',    # p=-1/2, q=-3/2
 ('matematik','101976'): '10',    # 16+19-25
 ('matematik','102109'): '35000', # 6x = 10000d, d=3
 ('matematik','102319'): '120',   # n=120, tek deger
 ('matematik','102359'): '56',    # 40320/720
 ('matematik','102986'): '2',     # bagil hiz v/2, B 1200 m
 ('matematik','103169'): '9',     # K=2S-6 ve K=S+3
 ('matematik','103172'): '48',    # ogul 12
 ('matematik','103184'): '13',    # 2A+2 = A+15
 ('matematik','103187'): '28',    # ogul 7
 ('matematik','103343'): '257',   # 17^2 - 2x16
 ('matematik','103351'): '7',     # 8-3+2
 ('matematik','103455'): '62',    # 2b+8=70
 ('matematik','103546'): '57/251',# Bayes
}

# Gerekcesi "bu deger siklarda yok" diye biten, otomatik temizlemenin
# yakalayamadigi dort kayit — aciklamalari elle yazildi.
ACK = {
 ('matematik','100765'):
  "Maliyet kârla satılan kısım x, zararla satılan kısım y olsun. "
  "Toplam kâr: 0,25x − 0,10y = 0,05(x + y) olur. "
  "Düzenlenirse 0,20x = 0,15y, yani x/y = 15/20 = 3/4 bulunur. "
  "Doğru cevap D) 3/4 şeklindedir.",
 ('matematik','101940'):
  "Ayşe şu an 18 ise 5 yıl önce 13 yaşındaydı. "
  "O tarihte annesinin yaşının yarısına eşit olduğundan anne 5 yıl önce 26 yaşındaydı. "
  "Annenin şimdiki yaşı 26 + 5 = 31'dir. Doğru cevap B) 31 şeklindedir.",
 ('matematik','101957'):
  "f(f(1)) = f(f(2)) = 0 ve f(1) ≠ f(2) ise f(1) ile f(2), f'nin iki ayrı köküdür. "
  "Köklerin toplamı −p olduğundan (1+p+q) + (4+2p+q) = −p, yani 4p + 2q = −5. "
  "Köklerin çarpımı q olduğundan (1+p+q)(4+2p+q) = q. "
  "İki denklem birlikte çözülürse p = −1/2 ve q = −3/2 bulunur; p + q = −2'dir. "
  "Doğru cevap E) -2 şeklindedir.",
 ('matematik','103351'):
  "x⁴ − 5x² + 4 = 0 denkleminde x² yerine t konursa t² − 5t + 4 = 0, "
  "yani t = 1 veya t = 4 olur. Pozitif kökler x₁ = 1 ve x₂ = 2'dir. "
  "x₂³ − 3x₁² + x₂ = 8 − 3 + 2 = 7 bulunur. Doğru cevap A) 7 şeklindedir.",
}


# --- bankaya alinmayanlar: gerekcesiyle ---
RED = {
 ('matematik','100075'): 'cevap 102; kalan siklar 15-27 araliginda, 102 hesap yapilmadan ayirt edilir',
 ('matematik','100330'): 'aracin degeri (42) ara deger; gercek cevap 82 ve siklar 116-122 kumesinin disinda',
 ('matematik','100337'): 'aracin degeri (120) x degeri; istenen "kac farkli deger" = 1, sik kumesinin disinda',
 ('matematik','100351'): 'EBOB^2=288 tam kare degil, cevap 0 cift — dejenere soru',
 ('matematik','100353'): 'cevap 230400; en buyuk sik 11520, ~20 kat fark',
 ('matematik','100459'): 'cevap 175/176; diger siklar negatif ve /44, /55, /11 paydali — bicim uyusmuyor',
 ('matematik','100671'): 'gecerli oy 1200/0,09 = 13.333,3 — tam sayi cikmiyor, soru hatali',
 ('matematik','100686'): 'soru Mart ayi sonunu soruyor ama Mart icin veri verilmemis',
 ('matematik','101110'): 'cozum anneyi 16 yasinda veriyor (kizi 4) — gercekdisi',
 ('matematik','101202'): 'x=7 cikiyor ama en kucuk cocugun yasi cift olmali — soru celiskili',
 ('matematik','101524'): 'cevap 910; en buyuk sik 420, ~2,2 kat fark',
 ('matematik','101734'): 'cevap 30; diger dort sik 7-15 arasi tek sayilar — ayirt edilir',
 ('matematik','101743'): 'gerekce "ifade tek turlu belirlenemez" diyor — belirsiz soru',
 ('matematik','101744'): 'aracin degeri (11/101) ara deger; istenen fark 187/1010 ve olcek uyusmuyor',
 ('matematik','101927'): 'cevap 14; diger siklar 2-6 arasi tek haneli — ayirt edilir',
 ('matematik','101945'): 'cevap 105; en buyuk sik 51, ~2,1 kat fark',
 ('matematik','101964'): 'cevap 152; siklar 2-18 arasi, ~8,4 kat fark',
 ('matematik','102299'): 'cevap 6/7; diger siklar 1/70-3/35 arasi, ~10 kat fark',
 ('matematik','102415'): 'diger dort sikkin payi 7, cevabin payi 14 — hesap yapilmadan secilir',
 ('matematik','102454'): '"geriye kalan urunler" iki sekilde okunabiliyor — belirsiz soru',
 ('matematik','102713'): 'ek zam %0 cikiyor — dejenere soru',
 ('matematik','103182'): 'her iki kisi de 4 yasinda cikiyor, 10 yil once negatif yas',
 ('matematik','103202'): 'buyukbaba 35 yasinda cikiyor (torunu 5) — gercekdisi',
 ('matematik','103243'): 'anne 22, kizi 6 yasinda cikiyor — gercekdisi',
 ('matematik','103319'): 'cevap +84, diger dort sik negatif — hesap yapilmadan secilir',
 ('matematik','103333'): 'a+b+c=0 iken a^3+b^3+c^3=3abc; veri deger tek belirlemiyor',
 ('matematik','103363'): 'aracin degeri (18) k; istenen a+b+k = 26 ve diger siklar <= 0',
 ('matematik','103646'): 'hicbir hesap yontemi siklarla ortusmuyor',
}


def main(yaz):
    ars = json.load(io.open(ARSIV, encoding='utf8'))
    geri, kalan = [], []
    for q in ars:
        anah = (q.get('dersId') or '', str(q['id']))
        if anah in KABUL:
            geri.append((anah, q))
        else:
            kalan.append(q)
    bulunan = {a for a, _ in geri}
    eksik = set(KABUL) - bulunan
    if eksik:
        print('!! arsivde bulunamadi:', sorted(eksik)); return

    banka, degisen = {}, collections.Counter()
    for (ders, sid), q in geri:
        yol = f'{KOK}/{ders}.json'
        if ders not in banka:
            banka[ders] = json.load(io.open(yol, encoding='utf-8-sig'))
        if any(str(x['id']) == sid for x in banka[ders]):
            print(f'  ~ {ders} #{sid} zaten bankada, atlandi'); continue
        yeni = KABUL[(ders, sid)]
        q = {k: v for k, v in q.items() if k != '_cikarmaGerekcesi'}
        eski = str(q['secenekler'][q['dogru']])
        q['secenekler'][q['dogru']] = yeni
        ger = sikonar.gerekce_temizle(
            [x for x in ars if str(x['id']) == sid and (x.get('dersId') or '') == ders
             ][0].get('_cikarmaGerekcesi', ''))
        q['aciklama'] = ACK.get((ders, sid)) or (
            ger + f" Doğru cevap {H[q['dogru']]}) {yeni} şeklindedir.")
        banka[ders].append(q)
        degisen[ders] += 1
        print(f"  + {ders:12} #{sid:<8} {H[q['dogru']]}) {eski!r} -> {yeni!r}")

    man = json.load(io.open(MANIFEST, encoding='utf-8-sig'))
    for d in man.get('dersler', []):
        if d.get('id') in banka:
            d['soruSayisi'] = len(banka[d['id']])
    toplam = sum(d.get('soruSayisi', 0) for d in man.get('dersler', []))
    print(f'\ngeri alinan: {sum(degisen.values())}  |  arsivde kalan: {len(kalan)}')
    print(f'reddedilen aday: {len(RED)}  |  manifest toplami: {toplam}')
    if not yaz:
        print('\n(deneme turu — hicbir dosya degismedi)')
        return
    for ders, liste in banka.items():
        json.dump(liste, io.open(f'{KOK}/{ders}.json', 'w', encoding='utf8'),
                  ensure_ascii=False, indent=1)
    json.dump(man, io.open(MANIFEST, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    json.dump(kalan, io.open(ARSIV, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    df = denetim.defter_oku()
    for (ders, sid), _ in geri:
        df[f'{ders}:{sid}'] = f'arsivden geri alindi; anahtar sikkinin metni elle duzeltildi -> {KABUL[(ders,sid)]}'
    for (ders, sid), neden in RED.items():
        df[f'{ders}:{sid}'] = f'arsivde kaliyor (sik onarimi reddedildi): {neden}'
    denetim.defter_yaz(df)
    print('yazildi.')


if __name__ == '__main__':
    main(len(sys.argv) > 1 and sys.argv[1] == 'yaz')
