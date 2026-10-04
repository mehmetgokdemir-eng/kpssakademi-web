# -*- coding: utf-8 -*-
"""Soru denetim defteri — hangi soru incelendi, ne yapıldı.

Kullanim:
  python3 denetim.py liste <ders> [konu]     -> sirada bekleyen sorular
  python3 denetim.py dok <ders> <n>          -> siradaki n soruyu tam metinle doker
  python3 denetim.py durum                   -> genel ilerleme
"""
import json, io, os, sys, re, glob

import os as _os
# Proje kokune gore cozulur: tools/soru-araclari/<klasor>/ -> ../../../public/data/sorular
KOK = _os.path.abspath(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)),
                                     '..', '..', '..', 'public', 'data', 'sorular'))
SP = os.path.dirname(os.path.abspath(__file__))
DEFTER = f'{SP}/defter.json'

ITIRAF = re.compile(r'(soru hatalı|soru tutarsız|soru yanlış kurgulanmış|hatalı kurgulanmış|hatalı kurulmuş|'
                    r'seçeneklerin hiçbiri|şıklarda .{0,15}yok|cevap tutarsız|tutarsız olduğundan|'
                    r'en yakın (ve )?(doğru|mantıklı|makul)|en yakın şık|soruyu yeniden yaz|yeniden yazalım|yeniden kuruyorum)', re.I)
KOD = re.compile(r'\banswer\s*[:=]', re.I)

def defter_oku():
    return json.load(io.open(DEFTER, encoding='utf8')) if os.path.exists(DEFTER) else {}

def defter_yaz(d):
    json.dump(d, io.open(DEFTER, 'w', encoding='utf8'), ensure_ascii=False, indent=0)

def kusurlu(q):
    a = str(q.get('aciklama', ''))
    t = []
    if ITIRAF.search(a): t.append('bozuk')
    if KOD.search(a): t.append('kod')
    return t

def bekleyen(ders, konu=None):
    d = json.load(io.open(f'{KOK}/{ders}.json', encoding='utf8'))
    df = defter_oku()
    out = []
    for q in d:
        if konu and q['konuId'] != konu: continue
        if df.get(f"{ders}:{q['id']}"): continue
        if kusurlu(q): out.append(q)
    return out

def kaydet(ders, kayitlar):
    """kayitlar: {soru_id: 'duzeltildi' | 'sorun yok' | 'not...'}"""
    df = defter_oku()
    for i, not_ in kayitlar.items():
        df[f'{ders}:{i}'] = not_
    defter_yaz(df)
    print(f'deftere islendi: {len(kayitlar)} | toplam kayit: {len(df)}')

if __name__ == '__main__':
    k = sys.argv[1]
    if k == 'durum':
        df = defter_oku()
        print(f'{"ders":16}{"kusurlu":>9}{"islenen":>9}{"kalan":>8}')
        tk = ti = 0
        for f in sorted(glob.glob(f'{KOK}/*.json')):
            ders = os.path.basename(f)[:-5]
            d = json.load(io.open(f, encoding='utf8'))
            ku = [q for q in d if kusurlu(q)]
            isl = sum(1 for q in ku if df.get(f"{ders}:{q['id']}"))
            if ku: print(f'{ders:16}{len(ku):>9}{isl:>9}{len(ku)-isl:>8}')
            tk += len(ku); ti += isl
        print(f'{"TOPLAM":16}{tk:>9}{ti:>9}{tk-ti:>8}')
    elif k == 'liste':
        for q in bekleyen(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None):
            print(q['id'], q['konuId'], '|', q['soru'][:70])
    elif k == 'dok':
        n = int(sys.argv[3]) if len(sys.argv) > 3 else 10
        konu = sys.argv[4] if len(sys.argv) > 4 else None
        for q in bekleyen(sys.argv[2], konu)[:n]:
            print('=' * 72)
            print(f"#{q['id']} [{q['konuId']}] kusur={','.join(kusurlu(q))}")
            print('S:', q['soru'])
            for j, s in enumerate(q['secenekler']):
                print(('  *' if j == q['dogru'] else '   '), 'ABCDE'[j], s)
            print('A:', str(q['aciklama'])[:600])
