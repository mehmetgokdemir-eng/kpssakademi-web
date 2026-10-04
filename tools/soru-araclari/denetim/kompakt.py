# -*- coding: utf-8 -*-
"""Kompakt triyaj dokumu: tam metin yerine karar icin gereken en az bilgi."""
import json, io, os, sys, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import denetim, ayikla

def kis(s, n): 
    s = ' '.join(str(s).split())
    return s if len(s) <= n else s[:n-1] + '…'

def dok(ders, n=20, kova=None, atla=0):
    d = json.load(io.open(f'{denetim.KOK}/{ders}.json', encoding='utf8'))
    df = denetim.defter_oku()
    say = 0; gecti = 0
    for q in d:
        if df.get(f"{ders}:{q['id']}") or not denetim.kusurlu(q): continue
        tur, i, kanit = ayikla.sinifla(q)
        if kova and tur != kova: continue
        if gecti < atla: gecti += 1; continue
        say += 1
        if say > n: break
        sec = ' | '.join(f"{'ABCDE'[j]}{'*' if j==q['dogru'] else ''}{'>' if j==i else ''} {kis(s,26)}"
                         for j, s in enumerate(q['secenekler']))
        print(f"#{q['id']} [{tur}] {kis(q['soru'],150)}")
        print(f"   {sec}")
        print(f"   kanit: {kis(kanit,40)} || aciklama: {kis(q['aciklama'],260)}")

if __name__ == '__main__':
    dok(sys.argv[1], int(sys.argv[2]) if len(sys.argv)>2 else 20,
        sys.argv[3] if len(sys.argv)>3 else None,
        int(sys.argv[4]) if len(sys.argv)>4 else 0)
