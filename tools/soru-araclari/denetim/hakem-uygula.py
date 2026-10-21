# -*- coding: utf-8 -*-
"""Aciklama Fabrikasi'nin HAKEM kararlarini uygular.

  python3 hakem-uygula.py hakem.json          -> deneme turu
  python3 hakem-uygula.py hakem.json yaz      -> uygular

Girdi: [{"ders":"turkce","id":"38553","karar":"anahtar|model|bozuk",
         "yeniMetin":"...","aciklama":"...","gerekce":"..."}]

Yaptiklari:
  karar "model"   -> yalnizca aciklama yenilenir (anahtar dogruymus).
  karar "anahtar" -> yeniMetin'in BIREBIR esledigi sik anahtar yapilir ve
                     aciklama yenilenir.
  karar "bozuk"   -> bankaya DOKUNULMAZ; soru, cikar.py'nin anladigi bicimde
                     bozuklar.json dosyasina yazilir. Cikarma islemini
                     cikar.py yapar, boylece denemeler ve manifest de duzelir.

Guvenlik: aciklamada sik harfi atifi ("A sikki", "cevap C)", "B yanlistir")
kalmissa o kayit UYGULANMAZ; fabrikanin amaci zaten harfleri kaldirmak.
"anahtar" kararinda yeniMetin seceneklerden birine birebir uymuyorsa ya da
zaten mevcut anahtari gosteriyorsa kayit UYGULANMAZ.
"""
import json, io, os, re, sys, collections

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import denetim

KOK = denetim.KOK
SP = os.path.dirname(os.path.abspath(__file__))
HARFLER = 'ABCDE'

HARF_ATIF = re.compile(
    r"(?:cevap|yanıt)\s*:?\s*[A-E]\)"
    r"|(?<![^\W\d_])[A-E](?=\s+(?:şık|şikk|seçene))"
    r"|(?<![^\W\d_])[A-E](?=\s+(?:doğru|yanlış|hatalı)(?:dur|tur|tır|dır)?(?![^\W\d_]))",
    re.IGNORECASE,
)


def sade(s):
    return re.sub(r'\s+', ' ', str(s)).strip().lower()


def yukle(yol):
    return json.load(io.open(yol, encoding='utf-8-sig'))


def calis(kayitlar, yaz):
    gruplu = collections.defaultdict(list)
    for x in kayitlar:
        gruplu[x['ders']].append(x)

    say = collections.Counter()
    degisen = collections.Counter()
    bozuklar, atlanan, anahtarDegisen = [], [], []

    for ders, liste in sorted(gruplu.items()):
        yol = f'{KOK}/{ders}.json'
        if not os.path.exists(yol):
            say['dosya yok'] += len(liste)
            continue
        d = yukle(yol)
        indeks = {str(q['id']): q for q in d}
        for x in liste:
            sid = str(x['id'])
            karar = str(x.get('karar', '')).lower()
            q = indeks.get(sid)
            if q is None:
                say['soru bulunamadi'] += 1
                atlanan.append((ders, sid, 'soru yok'))
                continue

            if karar == 'bozuk':
                ger = str(x.get('gerekce', '')).strip()
                if len(ger) < 15:
                    say['bozuk gerekcesi yetersiz'] += 1
                    atlanan.append((ders, sid, 'bozuk gerekcesi kisa'))
                    continue
                bozuklar.append({'ders': ders, 'id': sid, 'islem': 'bozuk',
                                 'eski': HARFLER[q['dogru']], 'yeni': '', 'yeniSik': '',
                                 'gerekce': ger})
                say['bozuk listesine alindi'] += 1
                continue

            if karar not in ('anahtar', 'model'):
                say['taninmayan karar'] += 1
                atlanan.append((ders, sid, f'karar: {karar}'))
                continue

            ack = str(x.get('aciklama', '')).strip()
            if len(ack) < 60:
                say['aciklama cok kisa'] += 1
                atlanan.append((ders, sid, 'aciklama kisa'))
                continue
            m = HARF_ATIF.search(ack)
            if m:
                say['metinde sik harfi var'] += 1
                atlanan.append((ders, sid, f'harf atifi: ...{ack[max(0, m.start()-25):m.start()+25]}...'))
                continue

            if karar == 'anahtar':
                hedef = sade(x.get('yeniMetin', ''))
                eslesen = [i for i, s in enumerate(q['secenekler']) if sade(s) == hedef]
                if len(eslesen) != 1:
                    say['yeni metin sikka uymuyor'] += 1
                    atlanan.append((ders, sid, 'yeniMetin eslesmedi'))
                    continue
                yeni_i = eslesen[0]
                if yeni_i == q['dogru']:
                    say['yeni anahtar eskisiyle ayni'] += 1
                    atlanan.append((ders, sid, 'anahtar degismiyor'))
                    continue
                anahtarDegisen.append((ders, sid, HARFLER[q['dogru']], HARFLER[yeni_i],
                                       str(q['secenekler'][yeni_i])[:60]))
                q['dogru'] = yeni_i
                say['anahtar duzeltildi'] += 1
            else:
                say['anahtar dogrulandi'] += 1

            q['aciklama'] = ack
            degisen[ders] += 1

        if yaz and degisen[ders]:
            json.dump(d, io.open(yol, 'w', encoding='utf8'), ensure_ascii=False, indent=1)

    print(f'girdi: {len(kayitlar)}')
    for k, v in say.most_common():
        print(f'  {k:28}{v:>6}')
    if anahtarDegisen:
        print(f'\nANAHTARI DEGISEN {len(anahtarDegisen)} SORU (ilk 15):')
        for a in anahtarDegisen[:15]:
            print(f'  {a[0]:16} #{a[1]:<8} {a[2]} -> {a[3]}  {a[4]}')
    if atlanan:
        print(f'\natlanan {len(atlanan)} (ilk 10):')
        for a in atlanan[:10]:
            print('  -', a[0], '#' + a[1], '—', a[2])

    bp = os.path.join(SP, 'bozuklar.json')
    if not yaz:
        print('\n(deneme turu — hicbir dosya degismedi)')
        if bozuklar:
            print(f'yazilacakti: {bp} ({len(bozuklar)} soru)')
        return
    if bozuklar:
        json.dump(bozuklar, io.open(bp, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
        print(f'\nbozuk listesi: {bp} ({len(bozuklar)} soru)')
        print('cikarmak icin:  python3 cikar.py bozuklar.json yaz')
    df = denetim.defter_oku()
    for ders, sid, eski, yeni, _ in anahtarDegisen:
        df[f'{ders}:{sid}'] = f'hakem: anahtar {eski} -> {yeni}, aciklama yeniden yazildi'
    for x in kayitlar:
        if str(x.get('karar', '')).lower() == 'model':
            df[f"{x['ders']}:{x['id']}"] = 'hakem: anahtar dogrulandi, aciklama yeniden yazildi'
    denetim.defter_yaz(df)
    print('\nyazildi.')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    calis(yukle(sys.argv[1]), yaz=(len(sys.argv) > 2 and sys.argv[2] == 'yaz'))
