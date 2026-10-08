# -*- coding: utf-8 -*-
"""Bozuk soru onarimi — YALNIZCA "dogru cevap siklarda yok" tipindeki sorular.

Mantik: Hakem, sorunun dogru cevabini hesaplamis ama o deger siklar arasinda
yok. Soruyu atmak yerine, bankadaki YANLIS anahtar sikkinin METNI dogru
degerle degistirilir. Anahtar yerinde kalir, sik sayisi ve dagilimi bozulmaz.

Kullanim:
  python3 sikonar.py duzeltmeler.json           -> deneme turu, hicbir sey yazmaz
  python3 sikonar.py duzeltmeler.json yaz       -> uygular
  python3 sikonar.py duzeltmeler.json dok 30    -> adaylari tam metinle doker

GUVENLIK KURALLARI (hepsi birden saglanmazsa soruya DOKUNULMAZ):
  1. Gerekce, SONUC KONUMUNDA tek bir deger soylemeli ("sonuc X olur",
     "yani X'dir", "dogru cevap X"). Madde numarasi, yil, ara islem sayisi
     bu konumda sayilmaz.
  2. Butun siklar ayni bicimde olmali (hepsi sayisal ya da hepsi saat).
  3. Bulunan deger siklarda ZATEN BULUNMAMALI.
  4. Gerekce, sorunun kendisinin belirsiz/cok cevapli oldugunu soylememeli
     ("iki sik da dogru", "hangi yil oldugunu belirtmemis", "veri eksik").
  5. Yeni deger, kalan siklarla ayni olmamali (mukerrer sik olusmamali).
"""
import json, io, os, re, sys, collections

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import denetim

KOK = denetim.KOK
HARFLER = 'ABCDEFGH'

# Sonuc konumundaki degeri yakalayan kaliplar — sirayla denenir.
SONUC = [
    re.compile(r"(?:sonuç|doğru\s+(?:cevap|değer|sonuç|yanıt)|doğrusu)\s*[:=]?\s*"
               r"(?:olarak\s+)?(\d{1,2}[.:]\d{2}|-?\d+(?:[.,]\d+)?(?:/\d+)?)", re.I),
    re.compile(r"\byani\s+(?:yaklaşık\s+)?(\d{1,2}[.:]\d{2}|-?\d+(?:[.,]\d+)?(?:/\d+)?)"
               r"\s*(?:'|’)?(?:d[ıiuü]r|t[ıiuü]r|olur|olmalı)", re.I),
    re.compile(r"(\d{1,2}[.:]\d{2}|-?\d+(?:[.,]\d+)?(?:/\d+)?)\s*(?:'|’)?\s*"
               r"(?:olur|olmalıdır|bulunur|çıkar)\b", re.I),
]

# Sorunun kendisi belirsizse onarilmaz.
BELIRSIZ = re.compile(
    r"(iki şık da|her iki şık|çift doğru|birden fazla (doğru|şık)|hem .{1,25} hem .{1,25} doğru|"
    r"belirtilmediği|belirtmediği|hangi yıl|veri (eksik|yetersiz)|yetersiz veri|"
    r"belirsiz|muğlak|hatalı kurgulan|tanımsız|tutarsız|cevap tek değil|tek doğru (cevap|şık|değer)[^.]{0,10}yok|birden çok (cevap|çözüm)|cevabı tek değil|birden çok yoruma|"
    # "Boyle bir sayi yoktur" tipindekilerde gerekcedeki sayi ARA DEGERDIR,
    # cevap degildir. Bunlara dokunmak sorunu gizler.
    r"çözüm (yok|bulunma|mevcut değil)|koşul(u|ları)? sağlayan[^.]{0,30}yok|"
    r"sağlayan (sayı|değer|durum|çift)[^.]{0,15}yok|hiçbir (sayı|değer|durum)[^.]{0,15}yok|"
    r"mümkün değil|imkâns?ız|olamaz;|bulunmamaktadır;|"
    r"veriler(i|in)? çelişkili|çelişkilidir|çelişmektedir)", re.I)

# Bulunan degerin BICIMI siklarin bicimine uymali: tam sayi yerine kesir,
# gun yerine hiz (1/16) koymak soruyu daha da bozar.
def _sekil(t):
    t = str(t).strip().replace('%', '').replace(' ', '')
    if SAAT.match(t): return 'saat'
    if '/' in t: return 'kesir'
    if ',' in t or ('.' in t and not re.fullmatch(r'\d{1,3}(\.\d{3})+', t)): return 'ondalik'
    return 'tam'

SAAT = re.compile(r'^\d{1,2}[.:]\d{2}$')


def sayi(s):
    """Sik metnini karsilastirilabilir bicime getirir; saat ise metin birakir."""
    t = str(s).strip().replace('%', '').replace(' ', '')
    if SAAT.match(t):
        return t.replace(':', '.')
    t2 = t.replace(',', '.')
    m = re.fullmatch(r'-?\d+(?:\.\d+)?(?:/\d+)?', t2)
    return m.group(0) if m else None


def bicim_ayni(secenekler):
    """Butun siklar ayni turde mi (hepsi sayi ya da hepsi saat)?"""
    turler = set()
    for s in secenekler:
        t = str(s).strip().replace('%', '').replace(' ', '')
        if SAAT.match(t):
            turler.add('saat')
        elif sayi(s) is not None:
            turler.add('sayi')
        else:
            return False
    return len(turler) == 1


def deger_bul(gerekce):
    for kalip in SONUC:
        m = kalip.search(gerekce)
        if m:
            return m.group(1)
    return None


def bicimle(ham, ornek):
    """Bulunan degeri, mevcut siklarin yazim bicimine uydurur (% isareti, virgul)."""
    o = str(ornek).strip()
    yuzde = o.startswith('%')
    v = ham.replace('.', ',') if (',' in o and SAAT.match(ham) is None) else ham
    return ('%' + v) if yuzde else v


def tara(duzeltmeler):
    say = collections.Counter()
    adaylar = []
    banka = {}
    for x in duzeltmeler:
        if x.get('islem') != 'bozuk':
            continue
        ders = x['ders']
        if ders not in banka:
            yol = f'{KOK}/{ders}.json'
            if not os.path.exists(yol):
                say['dosya yok'] += 1; continue
            banka[ders] = {str(q['id']): q for q in json.load(io.open(yol, encoding='utf8'))}
        q = banka[ders].get(str(x['id']))
        if q is None:
            say['soru bulunamadi'] += 1; continue
        g = str(x.get('gerekce', ''))
        if BELIRSIZ.search(g):
            say['soru belirsiz — dokunulmaz'] += 1; continue
        sec = [str(s) for s in q['secenekler']]
        if not bicim_ayni(sec):
            say['sik bicimi uygun degil'] += 1; continue
        ham = deger_bul(g)
        if ham is None:
            say['gerekcede sonuc degeri yok'] += 1; continue
        # Gerekcede birden fazla aday deger geciyorsa (ör. "dahilse -13,
        # haricse -11") hangisinin cevap oldugu belirsizdir; dokunulmaz.
        adaylar_deger = {m.group(1) for k in SONUC for m in k.finditer(g)}
        if len(adaylar_deger) > 1:
            say['gerekcede birden fazla sonuc degeri'] += 1; continue
        # Gerekce, hesabin bir yerinde cikan degerin KABUL EDILEMEZ oldugunu
        # soyluyorsa (negatif, celiskili, olamaz) o deger cevap degildir.
        if re.search(r'(olamaz|kabul edilemez|geçersiz|anlamsız|negatif değer|'
                     r'varsayım(ı)? çelişkili|çelişkili)', g, re.I):
            say['gerekce degeri reddediyor'] += 1; continue
        hedef = sayi(ham) if SAAT.match(ham) is None else ham.replace(':', '.')
        mevcut = {sayi(s) for s in sec}
        if hedef in mevcut:
            say['deger zaten sikta'] += 1; continue
        sekiller = {_sekil(s) for s in sec}
        if len(sekiller) != 1 or _sekil(ham) not in sekiller:
            say['deger bicimi siklara uymuyor'] += 1; continue
        yeni_metin = bicimle(ham, sec[q['dogru']])
        if yeni_metin in sec:
            say['mukerrer sik olusur'] += 1; continue
        say['ONARILABILIR'] += 1
        adaylar.append((ders, q, x, yeni_metin))
    return say, adaylar, banka


# Gerekce "...ve bu deger siklarda yoktur" diye biter; sik onarildiktan sonra
# bu cumle yanlis olur ve ogrenciye celiskili gorunur. Temizlenir.
YOK_KUYRUK = re.compile(
    r'\s*[;,.]?\s*(?:ve\s+|ancak\s+|dolayısıyla\s+)?(?:bu\s+(?:değer|sayı|sonuç)\s+|'
    r'bu\s+değer\s+de\s+)?(?:hiçbir\s+şıkta\s+|hiçbir\s+seçenekle\s+)?'
    r'(?:şıklar(?:da|ın\s+arasında)?|seçenekler(?:de|in\s+arasında)?)\s*'
    r'(?:bulunmuyor|bulunmamaktadır|yok(?:tur)?|yer\s+almamaktadır|mevcut\s+değil)'
    r'[^.]*\.?\s*$', re.I)
YOK_KUYRUK2 = re.compile(
    r'\s*[;,.]?\s*(?:ve\s+)?hiçbir\s+(?:şıkk?a|seçeneğe|şıkla|seçenekle)\s*'
    r'(?:uymuyor|uyuşmuyor|denk\s+gelmiyor)[^.]*\.?\s*$', re.I)


def gerekce_temizle(g):
    g = str(g).strip()
    for _ in range(3):
        yeni = YOK_KUYRUK2.sub('', YOK_KUYRUK.sub('', g)).rstrip(' ;,')
        if yeni == g:
            break
        g = yeni
    if g and g[-1] not in '.!?':
        g += '.'
    return g


def uygula(adaylar, banka, yaz):
    df = denetim.defter_oku()
    degisen = collections.defaultdict(int)
    for ders, q, x, yeni in adaylar:
        eski = str(q['secenekler'][q['dogru']])
        q['secenekler'][q['dogru']] = yeni
        ger = gerekce_temizle(x.get('gerekce', ''))
        q['aciklama'] = ger + f" Doğru cevap {HARFLER[q['dogru']]}) {yeni} şeklindedir."
        df[f"{ders}:{q['id']}"] = f'sik onarildi (fabrika): {HARFLER[q["dogru"]]} sikki {eski} -> {yeni}'
        degisen[ders] += 1
    if yaz:
        for ders in degisen:
            yol = f'{KOK}/{ders}.json'
            json.dump(list(banka[ders].values()), io.open(yol, 'w', encoding='utf8'),
                      ensure_ascii=False, indent=1)
        denetim.defter_yaz(df)
    return degisen


if __name__ == '__main__':
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    duz = json.load(io.open(sys.argv[1], encoding='utf-8-sig'))
    say, adaylar, banka = tara(duz)
    for k, v in say.most_common():
        print(f'{k:34}{v:>5}')
    mod = sys.argv[2] if len(sys.argv) > 2 else 'deneme'
    if mod == 'dok':
        n = int(sys.argv[3]) if len(sys.argv) > 3 else 20
        for ders, q, x, yeni in adaylar[:n]:
            print('=' * 70)
            print(f"{ders} #{q['id']} | {HARFLER[q['dogru']]} sikki: "
                  f"{q['secenekler'][q['dogru']]!r} -> {yeni!r}")
            print('S:', q['soru'][:300])
            print('SIKLAR:', [str(s) for s in q['secenekler']])
            print('GEREKCE:', x['gerekce'][:260])
    elif mod == 'yaz':
        d = uygula(adaylar, banka, True)
        print('\nonarilan soru:', sum(d.values()), dict(d))
    else:
        print('\n(deneme turu — hicbir dosya degismedi. Yazmak icin "yaz" ekle.)')
