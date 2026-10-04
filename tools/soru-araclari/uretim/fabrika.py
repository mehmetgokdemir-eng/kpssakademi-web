# -*- coding: utf-8 -*-
"""Soru fabrikasi: yeni sorulari dogrular ve bankaya ekler.

Kullanim:
    python3 fabrika.py <ders> <batch.py>            -> yalnizca dogrula (kuru calisma)
    python3 fabrika.py <ders> <batch.py> --yaz      -> dogrula ve bankaya ekle

batch.py icinde SORULAR listesi bulunmali. Her ogenin bicimi:
    (konuId, zorluk, soru, [5 secenek], dogru_index, aciklama)

Otomatik denetimler:
  1. Sema: alanlar dolu, 5 secenek, dogru index gecerli, zorluk kolay/orta/zor
  2. konuId dersin mevcut konu listesinde olmali
  3. Secenekler birbirinin ayni olmamali
  4. Soru metni bankada zaten bulunmamali (tekrar engeli)
  5. UZUNLUK KURALI: dogru sik en uzun olmamali (metinsel sorularda)
  6. Bozuk cumle birlesimi olmamali ('... . ve ...')
  7. Aciklama en az 40 karakter
  8. Id'ler bankanin devami olarak otomatik atanir
"""
import json, io, os, re, sys, importlib.util, random, statistics

import os as _os
# Proje kokune gore cozulur: tools/soru-araclari/<klasor>/ -> ../../../public/data/sorular
KOK = _os.path.abspath(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)),
                                     '..', '..', '..', 'public', 'data', 'sorular'))
BOZ = re.compile(r'[.!?]\s+(?:ve|ancak|fakat|ile)\s+[a-zçğıöşü]')
ZORLUK = {'kolay', 'orta', 'zor'}

def yukle(ders):
    return json.load(io.open(f'{KOK}/{ders}.json', encoding='utf8'))

def metinsel(sec):
    return statistics.median([len(str(x)) for x in sec]) > 12

def olc(d, tur=20):
    def tek(rnd):
        dg = 0
        for q in d:
            L = [len(str(x)) for x in q['secenekler']]
            m = max(L); aday = [j for j, l in enumerate(L) if l == m]
            if rnd.choice(aday) == q['dogru']: dg += 1
        return dg / len(d) * 100
    return statistics.mean(tek(random.Random(s)) for s in range(tur))

def batch_yukle(yol):
    spec = importlib.util.spec_from_file_location('batch', yol)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m.SORULAR

def dogrula(ders, sorular):
    d = yukle(ders)
    konular = {q['konuId'] for q in d}
    mevcut = {q['soru'].strip() for q in d}
    hata = []
    uzun_sayisi = 0
    for n, s in enumerate(sorular):
        if len(s) not in (6, 7): hata.append((n, 'bicim: 6 ya da 7 alan olmali')); continue
        konu, zor, soru, sec, dog, acik = s[:6]
        # 7. alan True ise: dogru sik bilerek en uzun birakilir (dogal varyasyon).
        # Hepsi kisa olursa 'en kisayi sec' ters sizintisi dogar; bu yuzden
        # her partide sinirli sayida soruda dogru sik en uzun olmalidir.
        uzun_serbest = len(s) == 7 and s[6] is True
        if uzun_serbest: uzun_sayisi += 1
        e = lambda t: hata.append((n, f'{t} :: {soru[:60]}'))
        if konu not in konular: e(f'konuId gecersiz ({konu}); gecerli: {sorted(konular)}')
        if zor not in ZORLUK: e(f'zorluk gecersiz ({zor})')
        if len(sec) != 5: e(f'secenek sayisi {len(sec)}')
        elif len(set(map(str, sec))) != 5: e('ayni secenek var')
        if not isinstance(dog, int) or not 0 <= dog < len(sec): e('dogru index gecersiz')
        if soru.strip() in mevcut: e('soru bankada zaten var')
        if len(acik) < 40: e(f'aciklama cok kisa ({len(acik)})')
        for x in list(sec) + [soru, acik]:
            if BOZ.search(str(x)): e('bozuk cumle birlesimi')
        if not uzun_serbest and len(sec) == 5 and isinstance(dog, int) and 0 <= dog < 5 and metinsel(sec):
            L = [len(str(x)) for x in sec]
            if L[dog] > max(L[j] for j in range(5) if j != dog):
                e(f'UZUNLUK: dogru sik en uzun (d={L[dog]}, en={max(L[j] for j in range(5) if j != dog)})')
    if sorular and uzun_sayisi / len(sorular) > 0.35:
        hata.append((-1, f'dogru sikki en uzun soru orani cok yuksek: {uzun_sayisi}/{len(sorular)} (en cok %35)'))
    return d, hata

def ekle(ders, sorular, yaz=False):
    d, hata = dogrula(ders, sorular)
    for n, h in hata: print(f'!! [{n}] {h}')
    print(f'--- {ders}: {len(sorular)} soru | hata {len(hata)}')
    if hata: return
    son = max(int(q['id']) for q in d)
    yeni = []
    for s in sorular:
        konu, zor, soru, sec, dog, acik = s[:6]
        son += 1
        yeni.append({"id": str(son), "dersId": ders, "konuId": konu, "soru": soru,
                     "secenekler": list(sec), "dogru": dog, "aciklama": acik, "zorluk": zor})
    print(f'    sizinti: %{olc(d):.1f} -> %{olc(d + yeni):.1f} | toplam {len(d)} -> {len(d) + len(yeni)}')
    if yaz:
        json.dump(d + yeni, io.open(f'{KOK}/{ders}.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
        print('    YAZILDI')

if __name__ == '__main__':
    ekle(sys.argv[1], batch_yukle(sys.argv[2]), '--yaz' in sys.argv)
