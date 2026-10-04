# -*- coding: utf-8 -*-
"""Kontrol fabrikasi — cozucu yardimcilari.

Amac: soruyu kafadan cozmek yerine 1-2 satir kodla KESIN hesaplamak.
Her yardimci hem sonucu hem de aciklamada kullanilacak ara degerleri dondurur.
"""
from fractions import Fraction
from itertools import product, permutations, combinations
from math import gcd
import re

def ebob(*a):
    r = 0
    for x in a: r = gcd(r, int(x))
    return r

def ekok(*a):
    r = 1
    for x in a: r = r * int(x) // gcd(r, int(x))
    return r

def F(x, y=1): return Fraction(x, y)

def coz(denklemler, bilinmeyenler):
    """Dogrusal/dogrusal olmayan denklem sistemini KESIN cozer.
    coz(['a+b-40','a-b-8'], 'a b') -> {'a':24,'b':16}"""
    import sympy
    sem = sympy.symbols(bilinmeyenler)
    if not isinstance(sem, (list, tuple)): sem = (sem,)
    cozum = sympy.solve([sympy.sympify(d) for d in denklemler], sem, dict=True)
    if not cozum: return None
    return {str(k): (int(v) if getattr(v, 'is_Integer', False) else v) for k, v in cozum[0].items()}

def rakam_ara(kalip, kosul, deger):
    """Rakam yerlestirme sorulari. kalip: '3A47B' gibi; harfler bilinmeyen rakam.
    kosul(sayi, atama) -> bool ; deger(atama) -> sonuc
    Donus: (tum sonuclar kumesi, ornek atamalar)"""
    harfler = sorted(set(re.findall(r'[A-Z]', kalip)))
    sonuc = {}
    for kombin in product(range(10), repeat=len(harfler)):
        atama = dict(zip(harfler, kombin))
        s = kalip
        for h, v in atama.items(): s = s.replace(h, str(v))
        if s[0] == '0': continue
        n = int(s)
        if kosul(n, atama):
            sonuc.setdefault(deger(atama), []).append((n, dict(atama)))
    return sonuc

def permutasyon_say(rakamlar, kosul):
    """Verilen rakamlarin kac permutasyonu kosulu saglar."""
    say = 0; ornek = []
    for p in permutations(rakamlar):
        if p[0] == 0: continue
        n = int(''.join(map(str, p)))
        if kosul(n):
            say += 1
            if len(ornek) < 3: ornek.append(n)
    return say, ornek

def aralik_say(a, b, kosul):
    """a..b arasinda kosulu saglayan sayilarin adedi."""
    l = [n for n in range(a, b + 1) if kosul(n)]
    return len(l), l[:5]

def hedefe_ayarla(parametre_adaylari, hesap, siklar):
    """Soru kokundeki bir sayiyi, mevcut siklardan biri dogru cikacak sekilde arar.
    parametre_adaylari: denenecek degerler
    hesap(p) -> sonuc (ya da None)
    siklar: normalize edilmis sik degerleri listesi
    Donus: [(parametre, sonuc, sik_indeksi)]
    """
    out = []
    for p in parametre_adaylari:
        try: s = hesap(p)
        except Exception: continue
        if s is None: continue
        for j, v in enumerate(siklar):
            if v is not None and s == v: out.append((p, s, j))
    return out

def sik_degerleri(secenekler):
    """Siklari sayisal degere cevirir; cevrilemeyen None."""
    out = []
    for s in secenekler:
        t = str(s).strip().replace('%', '').replace(' ', '')
        t = re.sub(r'(TL|kg|km|saat|gün|yıl|adet|kişi)$', '', t, flags=re.I)
        m = re.fullmatch(r'(-?\d+)/(\d+)', t)
        if m: out.append(Fraction(int(m.group(1)), int(m.group(2)))); continue
        t2 = t.replace('.', '').replace(',', '.')
        try:
            f = Fraction(t2)
            out.append(int(f) if f.denominator == 1 else f)
        except Exception:
            out.append(None)
    return out
