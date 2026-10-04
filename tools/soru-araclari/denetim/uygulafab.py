# -*- coding: utf-8 -*-
"""Denetim fabrikasindan gelen duzeltmeler.json dosyasini bankaya uygular.

Kullanim:
  python3 uygulafab.py duzeltmeler.json            -> once ne yapacagini doker
  python3 uygulafab.py duzeltmeler.json yaz        -> dosyalara yazar

Dosya bicimi (fabrika uretir):
  [{"ders":"matematik","id":"100209","islem":"anahtar","eski":"E","yeni":"C",
    "yeniSik":"6","gerekce":"13^2023 mod 7 = 6"}]

islem = "anahtar" -> dogru alani yeni harfe alinir; aciklamanin sonundaki
                     taslak/yanlis sonuc cumleleri atilir, tek temiz sonuc
                     cumlesi eklenir (otomatik.ack_yenile ile).
islem = "bozuk"   -> DOSYA DEGISMEZ. Soru deftere "elle yazilmali" diye islenir.
"""
import json, io, os, sys, collections

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import denetim, otomatik

KOK = denetim.KOK
HARFLER = otomatik.HARFLER


def oku(yol):
    d = json.load(io.open(yol, encoding='utf-8-sig'))
    if not isinstance(d, list):
        raise SystemExit('Beklenen bicim: nesne dizisi.')
    return d


def uygula(duzeltmeler, yaz):
    df = denetim.defter_oku()
    grup = collections.defaultdict(list)
    for x in duzeltmeler:
        grup[x['ders']].append(x)

    ozet = collections.Counter()
    atlanan = []
    for ders, kayitlar in sorted(grup.items()):
        yol = f'{KOK}/{ders}.json'
        if not os.path.exists(yol):
            atlanan.append(f'{ders}: dosya yok')
            continue
        d = json.load(io.open(yol, encoding='utf8'))
        indeks = {str(q['id']): q for q in d}
        degisti = False
        for x in kayitlar:
            sid = str(x['id'])
            q = indeks.get(sid)
            anah = f'{ders}:{sid}'
            if q is None:
                atlanan.append(f'{ders} #{sid}: soru bulunamadi'); ozet['atlandi'] += 1; continue
            if x.get('islem') == 'bozuk':
                df[anah] = 'elle yazilmali (fabrika): ' + str(x.get('gerekce', ''))[:200]
                ozet['bozuk'] += 1
                continue
            yeni = str(x.get('yeni', '')).strip().upper()
            if yeni not in HARFLER or HARFLER.index(yeni) >= len(q['secenekler']):
                atlanan.append(f'{ders} #{sid}: gecersiz harf {yeni!r}'); ozet['atlandi'] += 1; continue
            j = HARFLER.index(yeni)
            if j == q['dogru']:
                df[anah] = 'sorun yok (fabrika): anahtar zaten dogru'
                ozet['zaten'] += 1
                continue
            ack = otomatik.ack_yenile(str(q.get('aciklama', '')), j, q['secenekler'][j])
            if ack is None:
                atlanan.append(f'{ders} #{sid}: aciklama govdesi yetersiz, elle yazilmali')
                df[anah] = 'elle yazilmali (fabrika): anahtar duzeltilebilir, aciklama yetersiz'
                ozet['atlandi'] += 1
                continue
            eski = HARFLER[q['dogru']]
            q['dogru'] = j
            q['aciklama'] = ack
            df[anah] = f'duzeltildi (fabrika): anahtar {eski}→{yeni}; ' + str(x.get('gerekce', ''))[:160]
            ozet['duzeltildi'] += 1
            degisti = True
        if degisti and yaz:
            json.dump(d, io.open(yol, 'w', encoding='utf8'), ensure_ascii=False, indent=1)

    if yaz:
        denetim.defter_yaz(df)

    print('duzeltildi :', ozet['duzeltildi'])
    print('bozuk isar.:', ozet['bozuk'])
    print('zaten dogru:', ozet['zaten'])
    print('atlandi    :', ozet['atlandi'])
    for a in atlanan[:40]:
        print('   -', a)
    if len(atlanan) > 40:
        print(f'   ... ve {len(atlanan)-40} tane daha')
    if not yaz:
        print('\n(deneme turu — hicbir dosya degismedi. Yazmak icin sonuna "yaz" ekle.)')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    uygula(oku(sys.argv[1]), yaz=(len(sys.argv) > 2 and sys.argv[2] == 'yaz'))
