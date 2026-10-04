# -*- coding: utf-8 -*-
"""Otomatik denetim — kusurlu sorulari kendi basina siniflar ve YALNIZCA
kanitin kesin oldugu durumlarda duzeltir.

Calistirma:
  python3 otomatik.py rapor      -> hicbir sey yazmaz, ne yapacagini doker
  python3 otomatik.py uygula     -> guvenli duzeltmeleri yazar, deftere isler

Karar kurallari (siraya gore):

  YANLIS-ALARM  Itiraf kalibi aslinda konunun kendisini anlatiyor
                ("nedensellik zincirinin hatali kurgulanmis olmasi") ve
                aciklamada kod sizintisi yok, harf de anahtarla uyumlu.
                -> soru saglam, deftere "sorun yok" yazilir, dosya degismez.

  DEGER         Aciklamanin SONUC konumundaki sayisi tam olarak bir sikka
                esliyor ve o sayi olumsuzlanmamis ("... degil", "en yakin").
                -> anahtar o sikka alinir. Aciklamanin iddia ettigi harf
                   veya answer:N'e GUVENILMEZ; sadece hesaplanan deger sayilir.

  KOD-TEMIZ     Anahtar zaten dogru, aciklamada yalnizca "answer:N" /
                "Dogru cevap X'dir" gibi teknik kuyruk kalmis.
                -> kuyruk silinir, anahtar ve metin degismez.

  BOZUK         Aciklama kendi hesabinin hicbir sikla eslesmedigini soyluyor
                ("en yakin sik", "seceneklerin hicbiri", negatif sonuc...).
                -> DOKUNULMAZ. Elle yeniden yazilmasi gerekir; panele dusurulur.
"""
import json, io, os, re, sys, glob, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import denetim

KOK = denetim.KOK
SP  = os.path.dirname(os.path.abspath(__file__))

# --- itiraf kaliplari: gercekten sorunun bozuklugunu itiraf edenler ---------
GERCEK_ITIRAF = re.compile(
    r'(soru hatalı|soru tutarsız|soru yanlış kurgulanmış|hatalı kurulmuş|'
    r'seçeneklerin hiçbiri|şıklarda .{0,15}yok|cevap tutarsız|tutarsız olduğundan|'
    r'en yakın (ve )?(doğru|mantıklı|makul)|en yakın şık|soruyu yeniden yaz|'
    r'yeniden yazalım|yeniden kuruyorum|yeniden hesaplanmalı|işlem hatası kontrol|'
    r'soru tasarım|örtüşen şık)', re.I)

# "hatalı kurgulanmış OLMASI" gibi adlasmis kullanim -> konuyu anlatiyor, itiraf degil
YANLIS_ALARM = re.compile(r'(hatalı kurgulanmış|hatalı kurulmuş|soru hatalı)\s+'
                          r'(olması|olmasıdır|olduğu|olabileceği)', re.I)

KOD   = re.compile(r'\banswer\s*[:=]\s*([0-7])')
KOD_KUYRUK = re.compile(r'\s*(?:→|->|\|)?\s*answer\s*[:=]\s*[0-7]\s*\.?\s*$', re.I)
HARF  = re.compile(r"(?:doğru\s+(?:cevap|yanıt)|yanıt|cevap)\s*[:\-]?\s*\(?([A-H])\)?[’'\s).]", re.I)
HARFLER = 'ABCDEFGH'

# sonuc konumu: son "=" sonrasi ya da sonuc sozcuklerinden sonrasi
SONUC_SOZ = re.compile(r'(sonuç|cevap|yanıt|bulunur|bulunmuştur|olur|eder|elde edilir|'
                       r'çıkar|kalan|toplam|=)\s*[:\s]', re.I)
OLUMSUZ = re.compile(r'(değil|yanlış|en yakın|örtüşen|olmadığı)', re.I)
# aciklama iki ayri sonuc arasinda gidip geliyorsa otomatik karar verilmez
KARARSIZ = re.compile(r'(yorumlarsak|yorumlanırsa|diyorsa cevap|ama soru|ancak şık|'
                      r'seçilmişse|şık sıralamasına göre|iki yorum|belirsiz|'
                      r'soru .{0,20}muğlak|hangisi kastediliyorsa)', re.I)
# aciklama sorunun kendisini degistirip cevaplamis -> soru metni bozuk
SORU_DEGISTI = re.compile(r'(soruyu\s[^.]{0,40}(düzelt|yeniden kur|değiştir)|'
                          r'sorudaki\s[^.]{0,50}yerine|soruyorsa|'
                          r'soru\w*\s[^.]{0,40}olmalıydı|seçeneklerde yok|'
                          r'soru\w*\s[^.]{0,30}(hatalı|eksik) (kurul|yazıl|ver))', re.I)
SAYI_RE = re.compile(r'-?\d+(?:[.,]\d+)?(?:/\d+)?')


def sayiya(s):
    """Sik metnini ya da aciklamadaki sayiyi karsilastirilabilir sayiya cevirir."""
    s = str(s).strip().replace('%', '').replace(' ', '')
    s = re.sub(r'[^\d,./-]', '', s)
    if not s: return None
    m = re.fullmatch(r'-?\d+(?:[.,]\d+)?(?:/\d+)?', s)
    if not m: return None
    t = m.group(0)
    try:
        if '/' in t:
            a, b = t.split('/'); return float(a.replace(',', '.')) / float(b.replace(',', '.'))
        return float(t.replace(',', '.'))
    except Exception:
        return None


def sonuc_bolgesi(a):
    """Aciklamanin son sonuc cumlesi/bolumu — sayi burada aranir."""
    parcalar = re.split(r'(?<=[.!?])\s+', a.strip())
    return ' '.join(parcalar[-3:]) if parcalar else a


def deger_esleme(q):
    """Aciklamanin sonuc bolgesindeki sayilar tam olarak bir sikka esliyor mu?"""
    a = str(q.get('aciklama', ''))
    bolge = sonuc_bolgesi(a)
    sik = [sayiya(s) for s in q['secenekler']]
    if sum(1 for x in sik if x is not None) < len(sik) - 1:
        return None, ''                      # sayisal olmayan sik seti
    bulunan = []
    for m in SAYI_RE.finditer(bolge):
        # olumsuzlanmis mi? (sayinin 40 karakterlik cevresine bak)
        cevre = bolge[max(0, m.start() - 40):m.end() + 40]
        if OLUMSUZ.search(cevre): continue
        d = sayiya(m.group(0))
        if d is None: continue
        bulunan.append(d)
    if not bulunan: return None, ''
    esl = set()
    for d in bulunan:
        for j, s in enumerate(sik):
            if s is None: continue
            if abs(s - d) <= max(1e-9, abs(s) * 1e-9): esl.add(j)
    if len(esl) == 1:
        j = esl.pop()
        return j, f'sonuç bölgesindeki {q["secenekler"][j]} yalnız {HARFLER[j]} şıkkıyla eşleşiyor'
    return None, ''


def _norm(t):
    t = str(t).lower()
    t = t.replace('×', '*').replace('·', '*').replace('−', '-').replace('–', '-')
    t = re.sub(r'[\s ]+', '', t)
    t = t.replace(',', '.')
    t = re.sub(r'[()\[\]{}\'"`’“”:;!?]', '', t)
    return t.rstrip('.')


def icerik_esleme(q):
    """Sikkin METNI aciklamada olumsuzlanmamis bicimde geciyor mu?
    Aciklamadaki harf ve answer:N guvenilmez oldugu icin asil kanit budur."""
    a = str(q.get('aciklama', ''))
    na = _norm(a)
    esl = []
    for j, s in enumerate(q['secenekler']):
        ns = _norm(s)
        if len(ns) < 5:                 # cok kisa metinler deger kuralina kalir
            continue
        if na.find(ns) < 0:
            continue
        bas = re.escape(str(s).strip()[:12])
        m = re.search(bas, a) if bas else None
        cevre = a[max(0, m.start() - 60):m.end() + 60] if m else ''
        if cevre and OLUMSUZ.search(cevre):
            continue
        esl.append(j)
    if len(esl) == 1:
        return esl[0], f'{HARFLER[esl[0]]} sikkinin metni aciklamada sonuc olarak geciyor'
    return None, ''


def karar(q):
    """(karar, hedef_index, gerekce) dondurur."""
    a = str(q.get('aciklama', ''))
    kod = KOD.search(a)
    kod_i = int(kod.group(1)) if kod else None
    harf_i = None
    for m in HARF.finditer(a):
        i = HARFLER.index(m.group(1).upper())
        if i < len(q['secenekler']): harf_i = i; break

    gercek = GERCEK_ITIRAF.search(a)
    alarm  = YANLIS_ALARM.search(a)

    if KARARSIZ.search(a):
        return 'BOZUK', None, 'açıklama iki ayrı sonuç arasında gidip geliyor; elle karar gerekir'
    if SORU_DEGISTI.search(a):
        return 'BOZUK', None, 'açıklama soruyu/şıkları değiştirerek cevaplamış; soru metni yeniden yazılmalı'

    # 1) yanlis alarm: gercek itiraf yok (ya da adlasmis kullanim), kod sizintisi da yok
    if kod_i is None and (not gercek or (alarm and gercek and alarm.start() <= gercek.start())):
        if harf_i is None or harf_i == q['dogru']:
            return 'YANLIS-ALARM', None, 'itiraf kalıbı konunun kendisini anlatıyor; anahtar tutarlı'

    # 2) bozukluk itirafi varsa deger eslemesi de olsa dokunmuyoruz
    if gercek and not (alarm and alarm.start() <= gercek.start()):
        return 'BOZUK', None, 'açıklama kendi hesabının şıklarla eşleşmediğini söylüyor'

    # 3) icerik/deger eslemesi — harf ve answer:N guvenilmez, kanit bunlar
    j, kanit = deger_esleme(q)
    ji, kaniti = icerik_esleme(q)
    if j is not None and ji is not None and j != ji:
        return 'BOZUK', None, 'sayısal sonuç ile şık metni farklı şıkları gösteriyor'
    if j is None and ji is not None:
        j, kanit = ji, kaniti
    if j is not None:
        if j != q['dogru']:
            return 'DEGER', j, kanit
        return 'KOD-TEMIZ', None, 'anahtar hesapla uyumlu; yalnızca teknik kuyruk var'

    # 4) kod/harf anahtarla uyumlu ve sayisal kanit yok -> sadece kuyruk temizligi
    if kod_i is not None and kod_i == q['dogru']:
        return 'KOD-TEMIZ', None, f'answer:{kod_i} anahtarla aynı'
    if kod_i is None and harf_i is not None and harf_i == q['dogru']:
        return 'KOD-TEMIZ', None, 'açıklamadaki harf anahtarla aynı'

    return 'BOZUK', None, 'kanıt kesin değil (kod/harf anahtarla çelişiyor, sayısal doğrulama yok)'


# aciklamanin SONUNDAKI taslak/meta cumleleri — ogrencinin gormemesi gerekenler
META = re.compile(r'(answer|şıkk?ı|şık |seçene|indeks|düzelt|olmalı|tutarsız|'
                  r'\bama\b|\bancak\b|bekle|tekrar|yeniden|kpss tarzı|not:|'
                  r'doğru cevap|cevap:|cevap [a-h]\)|yanıt)', re.I)


def ack_yenile(a, j, secenek):
    """Aciklamanin sonundaki taslak cumlelerini atar, tek temiz sonuc cumlesi ekler.
    Metnin govdesine DOKUNMAZ; regex ile cumle ici onarim yapilmaz.
    Govde cok kisa kalirsa None doner (elle yazilmasi gerekir)."""
    cumleler = [c for c in re.split(r'(?<=[.!?])\s+', str(a).strip()) if c.strip()]
    while cumleler and META.search(cumleler[-1]):
        cumleler.pop()
    govde = ' '.join(cumleler).strip()
    if len(govde) < 60:
        return None
    s = str(secenek).strip().rstrip('.')
    sonuc = (f'Doğru cevap {HARFLER[j]}) {s} şeklindedir.' if len(s) <= 60
             else f'Doğru cevap {HARFLER[j]} seçeneğidir.')
    return govde + ' ' + sonuc


def kuyruk_temizle(a):
    yeni = KOD_KUYRUK.sub('', a).rstrip()
    yeni = re.sub(r'\s*answer\s*[:=]\s*[0-7]\s*', ' ', yeni)
    yeni = re.sub(r'\s*(?:→|->)\s*$', '', yeni).rstrip()
    yeni = re.sub(r'[ \t]{2,}', ' ', yeni)
    if yeni and yeni[-1] not in '.!?)»"\'': yeni += '.'
    return yeni


def tara():
    sonuc = []
    for f in sorted(glob.glob(f'{KOK}/*.json')):
        ders = os.path.basename(f)[:-5]
        for q in json.load(io.open(f, encoding='utf8')):
            if not denetim.kusurlu(q): continue
            k, j, g = karar(q)
            sonuc.append((ders, q, k, j, g))
    return sonuc


def rapor(sonuc):
    say = collections.Counter(k for _, _, k, _, _ in sonuc)
    ders = collections.Counter((d, k) for d, _, k, _, _ in sonuc)
    print(f'kusurlu: {len(sonuc)}')
    for k in ('YANLIS-ALARM', 'DEGER', 'KOD-TEMIZ', 'BOZUK'):
        print(f'  {k:14}{say[k]:>5}')
    print()
    print(f'{"ders":18}{"alarm":>7}{"deger":>7}{"kodtmz":>8}{"bozuk":>7}')
    for d in sorted({x[0] for x in sonuc}):
        print(f'{d:18}{ders[(d,"YANLIS-ALARM")]:>7}{ders[(d,"DEGER")]:>7}'
              f'{ders[(d,"KOD-TEMIZ")]:>8}{ders[(d,"BOZUK")]:>7}')


def uygula(sonuc, yaz=True):
    df = denetim.defter_oku()
    degisim = collections.defaultdict(dict)   # ders -> {id: (alan, yeni)}
    for ders, q, k, j, g in sonuc:
        anah = f'{ders}:{q["id"]}'
        if k == 'YANLIS-ALARM':
            df[anah] = f'sorun yok (otomatik): {g}'
        elif k == 'DEGER':
            yeni = ack_yenile(str(q['aciklama']), j, q['secenekler'][j])
            if yeni is None:
                df[anah] = 'elle: anahtar duzeltilebilir ama aciklama govdesi yetersiz'
                continue
            degisim[ders][q['id']] = ('dogru', j, yeni)
            df[anah] = f'duzeltildi (otomatik): anahtar {HARFLER[q["dogru"]]}→{HARFLER[j]}; {g}'
        elif k == 'KOD-TEMIZ':
            yeni = ack_yenile(str(q['aciklama']), q['dogru'], q['secenekler'][q['dogru']])
            if yeni is None:
                df[anah] = 'elle: aciklama govdesi yetersiz'
                continue
            if yeni != str(q['aciklama']):
                degisim[ders][q['id']] = ('aciklama', None, yeni)
            df[anah] = f'sorun yok (otomatik): {g}; taslak kuyrugu temizlendi'
    # dosyalara yaz
    yazilan = 0
    for ders, kayitlar in degisim.items():
        yol = f'{KOK}/{ders}.json'
        d = json.load(io.open(yol, encoding='utf8'))
        for q in d:
            if q['id'] in kayitlar:
                alan, j, ack = kayitlar[q['id']]
                if alan == 'dogru': q['dogru'] = j
                q['aciklama'] = ack
                yazilan += 1
        if yaz:
            json.dump(d, io.open(yol, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    if yaz:
        denetim.defter_yaz(df)
    print(f'guncellenen soru: {yazilan} | deftere islenen: {len(df)}')


if __name__ == '__main__':
    s = tara()
    if len(sys.argv) > 1 and sys.argv[1] == 'uygula':
        rapor(s); print(); uygula(s, yaz=True)
    else:
        rapor(s)
