# -*- coding: utf-8 -*-
"""Kontrol fabrikasi — denetim ve yazma katmani.

kontrol(ders, id, deger, aciklama, soru=None, secenekler=None)
  - deger: KESIN hesaplanmis dogru sonuc (sayi/Fraction/str)
  - Fabrika bu degeri siklarla karsilastirir:
      * tek sikla esliyorsa  -> anahtari oraya alir
      * hicbir sikla eslemiyorsa -> YAZMAZ, uyarir (soru kokunu duzeltmek gerekir)
      * birden fazla sikla esliyorsa -> YAZMAZ (mukerrer sik)
  - aciklama zorunlu; icinde taslak/kod izi olmamali.
"""
import json, io, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import denetim, cozucu
from uygula import BOZ

KOK = denetim.KOK
_bekleyen = {}

def kontrol(ders, sid, deger, aciklama, soru=None, secenekler=None):
    d = json.load(io.open(f'{KOK}/{ders}.json', encoding='utf8'))
    q = next((x for x in d if x['id'] == str(sid)), None)
    if q is None: print(f'!! #{sid} bulunamadi'); return
    sec = list(secenekler) if secenekler else list(q['secenekler'])
    vals = cozucu.sik_degerleri(sec)
    esl = [j for j, v in enumerate(vals) if v is not None and v == deger]
    etiket = f'{ders} #{sid}'
    if len(esl) == 0:
        print(f'!! {etiket}: hesap {deger} hicbir sikla eslesmiyor -> siklar: {vals}')
        return
    if len(esl) > 1:
        print(f'!! {etiket}: hesap {deger} birden fazla sikla esliyor {esl}')
        return
    if denetim.ITIRAF.search(aciklama) or denetim.KOD.search(aciklama) or BOZ.search(aciklama):
        print(f'!! {etiket}: aciklamada taslak/kod/bozuk cumle izi'); return
    _bekleyen.setdefault(ders, {})[str(sid)] = {
        'dogru': esl[0], 'aciklama': aciklama,
        **({'soru': soru} if soru else {}),
        **({'secenekler': sec} if secenekler else {})}
    print(f'   {etiket}: {deger} -> {"ABCDE"[esl[0]]}' + ('' if esl[0] == q['dogru'] else f' (eski {"ABCDE"[q["dogru"]]})'))

def yaz():
    import uygula
    for ders, P in _bekleyen.items():
        uygula.uygula(ders, P)
    _bekleyen.clear()
