# -*- coding: utf-8 -*-
"""Duzeltmeleri uygular ve denetim defterine isler.

P = { soru_id: {'soru':..., 'secenekler':[...], 'dogru':i, 'aciklama':...} }
Yalnizca verilen alanlar degisir. Her soru icin 'aciklama' zorunludur
(eski aciklamalar taslak/itiraf metni icerdigi icin hepsi yenilenir).
"""
import json, io, os, sys, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import denetim

KOK = denetim.KOK
BOZ = re.compile(r'[.!?]\s+(?:ve|ancak|fakat|ile)\s+[a-zçğıöşü]')

def uygula(ders, P, yaz=True):
    yol = f'{KOK}/{ders}.json'
    d = json.load(io.open(yol, encoding='utf8'))
    idx = {q['id']: q for q in d}
    hata = []
    for i, yeni in P.items():
        i = str(i)
        q = idx.get(i)
        if not q: hata.append(f'#{i} bulunamadi'); continue
        if 'aciklama' not in yeni: hata.append(f'#{i} aciklama zorunlu'); continue
        for alan, deger in yeni.items():
            if alan not in ('soru', 'secenekler', 'dogru', 'aciklama'):
                hata.append(f'#{i} bilinmeyen alan {alan}'); continue
            q[alan] = deger
        s = q['secenekler']
        if len(s) < 4: hata.append(f'#{i} sik sayisi {len(s)}')
        if len(set(map(str, s))) != len(s): hata.append(f'#{i} ayni sik')
        if not (0 <= q['dogru'] < len(s)): hata.append(f'#{i} dogru index')
        if denetim.ITIRAF.search(q['aciklama']) or denetim.KOD.search(q['aciklama']):
            hata.append(f'#{i} aciklamada hala itiraf/kod izi var')
        for x in list(s) + [q['soru'], q['aciklama']]:
            if BOZ.search(str(x)): hata.append(f'#{i} bozuk cumle birlesimi')
    for h in hata: print('!!', h)
    print(f'{ders}: {len(P)} soru | hata {len(hata)}')
    if hata or not yaz: return False
    json.dump(d, io.open(yol, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    denetim.kaydet(ders, {str(i): 'duzeltildi' for i in P})
    print('YAZILDI')
    return True
