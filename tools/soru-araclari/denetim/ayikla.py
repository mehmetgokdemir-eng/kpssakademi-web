# -*- coding: utf-8 -*-
"""Kontrol fabrikasi — aciklamadan iddia edilen cevabi ayiklar, siklarla karsilastirir.

Her bozuk soruyu uc kovaya ayirir:
  A) ANAHTAR  -> aciklamada belirtilen cevap siklardan biri; anahtar farkli.
                 Duzeltme deterministik: anahtari o sikka al. (ucuz)
  B) HARF     -> aciklama bir harf soyluyor (ör. "Dogru cevap B'dir") ve
                 anahtar farkli. Duzeltme deterministik. (ucuz)
  C) ELLE     -> aciklamadaki sonuc hicbir sikla eslesmiyor; soru/sik yeniden
                 yazilmali. (pahali, okumak gerekir)
"""
import json, io, os, re, sys, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import denetim

KOK = denetim.KOK

# "Dogru cevap B'dir", "cevap B)", "answer:2", "Yanit (D)"
HARF = re.compile(r"(?:doğru\s+(?:cevap|yanıt)|yanıt|cevap)\s*[:\-]?\s*\(?([A-E])\)?[’'\s)]", re.I)
KOD  = re.compile(r"\banswer\s*[:=]\s*([0-4])")

def sayilar(metin):
    """Aciklamadaki butun sayilari dondurur (ondalikli ve kesirli dahil)."""
    out = set()
    for m in re.finditer(r'-?\d+(?:[.,]\d+)?(?:/\d+)?', metin):
        out.add(m.group(0).replace(',', '.'))
    return out

def normal(s):
    s = str(s).strip().replace('%', '').replace('.', '').replace(',', '.')
    m = re.fullmatch(r'-?\d+(?:\.\d+)?(?:/\d+)?', s)
    return m.group(0) if m else None

def sinifla(q):
    a = str(q.get('aciklama', ''))
    sec = [str(x) for x in q['secenekler']]
    dog = q['dogru']
    # 1) kod sizintisi dogrudan indeks veriyor
    m = KOD.search(a)
    if m:
        i = int(m.group(1))
        if 0 <= i < len(sec) and i != dog: return ('KOD', i, f'answer:{i}')
    # 2) aciklamada harf
    for m in HARF.finditer(a):
        i = 'ABCDE'.index(m.group(1).upper())
        if i < len(sec):
            if i != dog: return ('HARF', i, m.group(0).strip())
            break
    # 3) aciklamadaki son sonuc sayisi siklardan biriyle esliyor mu
    say = sayilar(a)
    esleme = [j for j, s in enumerate(sec) if normal(s) and normal(s) in say]
    if len(esleme) == 1 and esleme[0] != dog:
        return ('SAYI', esleme[0], f'aciklamada {normal(sec[esleme[0]])} var')
    return ('ELLE', None, '')

if __name__ == '__main__':
    import collections
    ozet = collections.Counter(); detay = []
    for f in sorted(glob.glob(f'{KOK}/*.json')):
        ders = os.path.basename(f)[:-5]
        for q in json.load(io.open(f, encoding='utf8')):
            if not denetim.kusurlu(q): continue
            tur, i, kanit = sinifla(q)
            ozet[tur] += 1
            if tur != 'ELLE': detay.append((ders, q['id'], tur, 'ABCDE'[q['dogru']], 'ABCDE'[i], kanit))
    print('kova dagilimi:', dict(ozet))
    print(f'otomatik duzeltilebilir: {len(detay)} | elle gereken: {ozet["ELLE"]}')
    json.dump(detay, io.open(f'{os.path.dirname(os.path.abspath(__file__))}/oneri.json','w',encoding='utf8'), ensure_ascii=False, indent=0)
    for d in detay[:20]: print('  ', d)
