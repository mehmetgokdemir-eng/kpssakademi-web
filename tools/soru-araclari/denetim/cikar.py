# -*- coding: utf-8 -*-
"""Bozuk sorulari bankadan cikarir.

  python3 cikar.py duzeltmeler.json          -> deneme turu (hicbir sey yazmaz)
  python3 cikar.py duzeltmeler.json yaz      -> uygular

Yaptiklari:
  1. islem="bozuk" olan sorulari public/data/sorular/<ders>.json icinden siler.
  2. Silinenleri tools/soru-araclari/denetim/cikarilanlar.json dosyasina
     ARSIVLER (ileride yeniden yazilmak uzere; hicbir sey kaybolmaz).
  3. Deneme sinavlarinin icine gomulu olan bozuk sorulari, AYNI DERSTEN
     saglam bir soruyla DEGISTIRIR — boylece denemelerin soru sayisi
     (40/120 gibi) ve yapisi bozulmaz. Ayni konudan ve ayni zorluktan
     aday varsa once o secilir.
  4. public/data/index.json manifestindeki ders basina soru sayilarini
     ve toplami gunceller.
"""
import json, io, os, sys, collections, random

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import denetim

SP = os.path.dirname(os.path.abspath(__file__))
KOK = denetim.KOK
VERI = os.path.abspath(os.path.join(KOK, '..'))
DENEME = os.path.join(VERI, 'denemeler')
MANIFEST = os.path.join(VERI, 'index.json')
ARSIV = os.path.join(SP, 'cikarilanlar.json')


def yukle(yol):
    return json.load(io.open(yol, encoding='utf-8-sig'))


def yaz_json(yol, veri, girinti=1):
    json.dump(veri, io.open(yol, 'w', encoding='utf8'), ensure_ascii=False, indent=girinti)


def calis(duz, yaz):
    bozuk = collections.defaultdict(set)
    gerekce = {}
    for x in duz:
        if x.get('islem') == 'bozuk':
            bozuk[x['ders']].add(str(x['id']))
            gerekce[(x['ders'], str(x['id']))] = x.get('gerekce', '')

    banka, arsiv, kalanlar = {}, [], {}
    silinen = collections.Counter()
    for ders, idler in sorted(bozuk.items()):
        yol = f'{KOK}/{ders}.json'
        if not os.path.exists(yol):
            print(f'  ! {ders}: dosya yok, atlandi'); continue
        d = yukle(yol)
        tut, at = [], []
        for q in d:
            (at if str(q['id']) in idler else tut).append(q)
        for q in at:
            q = dict(q)
            q['_cikarmaGerekcesi'] = gerekce.get((ders, str(q['id'])), '')
            arsiv.append(q)
        banka[ders] = tut
        silinen[ders] = len(at)

    # Degistirme icin saglam aday havuzu (cikarilanlar haric)
    for f in sorted(os.listdir(KOK)):
        if not f.endswith('.json'): continue
        ders = f[:-5]
        kalanlar[ders] = banka.get(ders) or yukle(f'{KOK}/{f}')

    # --- denemeler ---
    degisen_deneme = 0
    deneme_degisiklik = collections.Counter()
    bulunamadi = []
    deneme_yeni = {}
    for f in sorted(os.listdir(DENEME)):
        if not f.endswith('.json'): continue
        yol = os.path.join(DENEME, f)
        d = yukle(yol)
        kullanilan = set()
        for b in d.get('bolumler', []):
            for q in b.get('sorular', []):
                kullanilan.add((q.get('dersId'), str(q.get('id'))))
        degisti = False
        for b in d.get('bolumler', []):
            yeni_liste = []
            for q in b.get('sorular', []):
                anah = (q.get('dersId'), str(q.get('id')))
                if anah[1] not in bozuk.get(anah[0] or '', set()):
                    yeni_liste.append(q); continue
                yedek = adaybul(kalanlar.get(anah[0], []), q, kullanilan, anah[0])
                if yedek is None:
                    bulunamadi.append(f'{f}: {anah[0]} #{anah[1]}')
                    yeni_liste.append(q)   # yerine kondu bir sey yok, dokunma
                    continue
                kullanilan.add((anah[0], str(yedek['id'])))
                yeni_liste.append(yedek)
                deneme_degisiklik[f] += 1
                degisti = True
            b['sorular'] = yeni_liste
        if degisti:
            degisen_deneme += 1
            deneme_yeni[yol] = d

    # --- manifest ---
    man = yukle(MANIFEST)
    eski_toplam = sum(x.get('soruSayisi', 0) for x in man.get('dersler', []))
    for ders_kaydi in man.get('dersler', []):
        did = ders_kaydi.get('id')
        if did in kalanlar:
            ders_kaydi['soruSayisi'] = len(kalanlar[did])
    yeni_toplam = sum(x.get('soruSayisi', 0) for x in man.get('dersler', []))

    print(f'{"ders":24}{"cikarilan":>10}{"kalan":>8}')
    for ders in sorted(silinen):
        print(f'{ders:24}{silinen[ders]:>10}{len(kalanlar[ders]):>8}')
    print(f'{"TOPLAM":24}{sum(silinen.values()):>10}{yeni_toplam:>8}')
    print(f'\nmanifest toplami: {eski_toplam} -> {yeni_toplam}')
    print(f'denemelerde degistirilen soru: {sum(deneme_degisiklik.values())} '
          f'({degisen_deneme} deneme dosyasi)')
    if bulunamadi:
        print(f'yedek bulunamayan: {len(bulunamadi)}')
        for b in bulunamadi[:10]: print('   -', b)

    if not yaz:
        print('\n(deneme turu — hicbir dosya degismedi. Yazmak icin "yaz" ekle.)')
        return

    for ders, liste in banka.items():
        yaz_json(f'{KOK}/{ders}.json', liste)
    for yol, d in deneme_yeni.items():
        yaz_json(yol, d)
    yaz_json(MANIFEST, man)
    eski_arsiv = yukle(ARSIV) if os.path.exists(ARSIV) else []
    varolan = {(q.get('dersId'), str(q.get('id'))) for q in eski_arsiv}
    for q in arsiv:
        if (q.get('dersId'), str(q.get('id'))) not in varolan:
            eski_arsiv.append(q)
    yaz_json(ARSIV, eski_arsiv)
    df = denetim.defter_oku()
    for q in arsiv:
        df[f"{q.get('dersId')}:{q['id']}"] = 'bankadan cikarildi (bozuk); arsivde saklaniyor'
    denetim.defter_yaz(df)
    print(f'\nyazildi. arsiv: {ARSIV} ({len(eski_arsiv)} soru)')


def adaybul(havuz, q, kullanilan, ders):
    """Ayni dersten, denemede kullanilmamis saglam bir soru sec.
    Once ayni konu + ayni zorluk, sonra ayni konu, sonra ayni zorluk."""
    konu, zor = q.get('konuId'), q.get('zorluk')
    kademeler = [
        lambda c: c.get('konuId') == konu and c.get('zorluk') == zor,
        lambda c: c.get('konuId') == konu,
        lambda c: c.get('zorluk') == zor,
        lambda c: True,
    ]
    for kosul in kademeler:
        adaylar = [c for c in havuz
                   if (ders, str(c['id'])) not in kullanilan and kosul(c)]
        if adaylar:
            return dict(random.Random(str(q.get('id'))).choice(adaylar))
    return None


if __name__ == '__main__':
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    calis(yukle(sys.argv[1]), yaz=(len(sys.argv) > 2 and sys.argv[2] == 'yaz'))
