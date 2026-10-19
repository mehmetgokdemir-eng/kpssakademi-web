# -*- coding: utf-8 -*-
"""Aciklama Fabrikasi'nin urettigi aciklamalari bankaya uygular.

  python3 ack-uygula.py aciklamalar.json          -> deneme turu
  python3 ack-uygula.py aciklamalar.json yaz      -> uygular

Girdi bicimi: [{"ders":"turkce","id":"38540","aciklama":"..."}]

Guvenlik denetimleri (gecmeyen kayit UYGULANMAZ):
  1. Soru bankada bulunmali.
  2. Yeni aciklamada sik harfi atifi ("A sikki", "cevap C)", "B yanlistir")
     OLMAMALI — fabrikanin amaci zaten bunlari kaldirmak.
  3. Aciklama en az 60 karakter olmali.
"""
import json, io, os, re, sys, collections

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import denetim

KOK = denetim.KOK

# Sik harfi atifi. "X)" bicimi YALNIZCA "cevap/yanit" onekiyle sayilir;
# yoksa matematikteki 11(A+B), P(A), "2-3°C)" gibi ifadeler yanlislikla
# harf atifi sanilir.
HARF_ATIF = re.compile(
    r"(?:cevap|yanıt)\s*:?\s*[A-E]\)"
    r"|(?<![^\W\d_])[A-E](?=\s+(?:şık|şikk|seçene))"
    r"|(?<![^\W\d_])[A-E](?=\s+(?:doğru|yanlış|hatalı)(?:dur|tur|tır|dır)?(?![^\W\d_]))",
    re.IGNORECASE,
)


def yukle(yol):
    return json.load(io.open(yol, encoding='utf-8-sig'))


def calis(kayitlar, yaz):
    gruplu = collections.defaultdict(list)
    for x in kayitlar:
        gruplu[x['ders']].append(x)

    say = collections.Counter()
    degisen = collections.Counter()
    atlanan = []
    for ders, liste in sorted(gruplu.items()):
        yol = f'{KOK}/{ders}.json'
        if not os.path.exists(yol):
            say['dosya yok'] += len(liste); continue
        d = yukle(yol)
        indeks = {str(q['id']): q for q in d}
        for x in liste:
            sid = str(x['id'])
            ack = str(x.get('aciklama', '')).strip()
            q = indeks.get(sid)
            if q is None:
                say['soru bulunamadi'] += 1; atlanan.append((ders, sid, 'soru yok')); continue
            if len(ack) < 60:
                say['aciklama cok kisa'] += 1; atlanan.append((ders, sid, 'kisa')); continue
            m = HARF_ATIF.search(ack)
            if m:
                say['metinde sik harfi var'] += 1
                atlanan.append((ders, sid, f'harf atifi: ...{ack[max(0,m.start()-30):m.start()+30]}...'))
                continue
            if q.get('aciklama') == ack:
                say['zaten ayni'] += 1; continue
            q['aciklama'] = ack
            say['uygulandi'] += 1
            degisen[ders] += 1
        if yaz and degisen[ders]:
            json.dump(d, io.open(yol, 'w', encoding='utf8'), ensure_ascii=False, indent=1)

    print(f'girdi: {len(kayitlar)}')
    for k, v in say.most_common():
        print(f'  {k:24}{v:>6}')
    if degisen:
        print('\nders basina:')
        for k, v in sorted(degisen.items()):
            print(f'  {k:24}{v:>6}')
    if atlanan:
        print(f'\natlanan ilk 10:')
        for a in atlanan[:10]:
            print('  -', a[0], '#' + a[1], '—', a[2])
    if yaz:
        df = denetim.defter_oku()
        for ders, liste in gruplu.items():
            for x in liste:
                df[f"{ders}:{x['id']}"] = 'aciklama fabrikada yeniden yazildi (sik harfi kullanilmadan)'
        denetim.defter_yaz(df)
        print('\nyazildi.')
    else:
        print('\n(deneme turu — hicbir dosya degismedi)')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    calis(yukle(sys.argv[1]), yaz=(len(sys.argv) > 2 and sys.argv[2] == 'yaz'))
