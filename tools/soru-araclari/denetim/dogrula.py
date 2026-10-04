# -*- coding: utf-8 -*-
import json, io, sys, subprocess, random, statistics
import os as _os
# Proje kokune gore cozulur: tools/soru-araclari/<klasor>/ -> ../../../public/data/sorular
KOK = _os.path.abspath(_os.path.join(_os.path.dirname(_os.path.abspath(__file__)),
                                     '..', '..', '..', 'public', 'data', 'sorular'))
from hedef import olc
tamam=True
for ders in sys.argv[1:]:
    yol=f'public/data/sorular/{ders}.json'
    yeni=json.load(io.open(f'{KOK}/{yol}',encoding='utf8'))
    eski=json.loads(subprocess.run(['git','show',f'HEAD:{yol}'],cwd=KOK,capture_output=True,text=True).stdout)
    hata=[]; degisen=0; dogru_degisen=[]
    if len(eski)!=len(yeni): hata.append('soru sayisi degisti')
    for i,(a,b) in enumerate(zip(eski,yeni)):
        for alan in ('id','soru','dogru','aciklama','konu','zorluk'):
            if (alan in a or alan in b) and a.get(alan)!=b.get(alan): hata.append(f'#{i}: {alan} degisti')
        if len(a['secenekler'])!=len(b['secenekler']): hata.append(f'#{i}: sik sayisi degisti')
        if any(not str(x).strip() for x in b['secenekler']): hata.append(f'#{i}: bos sik')
        if len(set(map(str,b['secenekler'])))!=len(b['secenekler']): hata.append(f'#{i}: tekrar eden sik')
        if a['secenekler']!=b['secenekler']: degisen+=1
        if str(a['secenekler'][a['dogru']])!=str(b['secenekler'][b['dogru']]): dogru_degisen.append(i)
    d='TAMAM' if not hata else f'HATA({len(hata)})'
    print(f'{ders:18} {len(yeni):5} soru | degisen {degisen:4} | dogru sik degisen {dogru_degisen} | %{olc(eski):.1f} -> %{olc(yeni):.1f} | {d}')
    if hata: tamam=False; [print('   ',h) for h in hata[:10]]
sys.exit(0 if tamam else 1)
