# -*- coding: utf-8 -*-
"""Bir dersteki 'en uzun sik = dogru sik' sizintisini tasiyan sorulari hedef listesine cikarir."""
import json, io, sys, os, statistics, random
import os as _os
# Proje kokune gore cozulur: tools/soru-araclari/<klasor>/ -> ../../../public/data/sorular
KOK = _os.path.abspath(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)),
                                     '..', '..', '..', 'public', 'data', 'sorular'))
SP=os.path.dirname(os.path.abspath(__file__))

def yukle(ders):
    return json.load(io.open(f'{KOK}/{ders}.json',encoding='utf8'))

def metinsel(q):
    """Sayisal / kisa secenekli sorularda uzunluk sinyali yok -> disla."""
    L=[len(str(x)) for x in q['secenekler']]
    return statistics.median(L) > 12

def marj(q):
    L=[len(str(x)) for x in q['secenekler']]; c=q['dogru']
    return L[c]-max(L[j] for j in range(len(L)) if j!=c)

def enuzunsec(d, rnd):
    dg=0
    for q in d:
        L=[len(str(x)) for x in q['secenekler']]
        m=max(L); aday=[j for j,l in enumerate(L) if l==m]
        if rnd.choice(aday)==q['dogru']: dg+=1
    return dg/len(d)*100

def olc(d):
    return statistics.mean(enuzunsec(d,random.Random(s)) for s in range(20))

if __name__=='__main__':
    ders=sys.argv[1]
    d=yukle(ders)
    hedef=[i for i,q in enumerate(d) if metinsel(q) and marj(q)>10]
    json.dump(hedef, io.open(f'{SP}/{ders}_hedef.json','w',encoding='utf8'))
    print(f'{ders}: {len(d)} soru | hedef {len(hedef)} | "en uzunu sec" %{olc(d):.1f}')
