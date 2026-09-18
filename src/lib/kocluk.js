/* Koçluk katmanı — "kişiye özel öğretmen" davranışının beyni.
 *
 * TASARIM KARARI: burada yeni bir veri deposu YOK. Bütün çıkarımlar
 * storage.js'teki mevcut kayıtlardan (cozulen, gunluk, denemeler, tekrar)
 * hesaplanıyor. Böylece eski kullanıcıların geçmişi de anında anlam kazanıyor
 * ve senkronize edilecek ikinci bir gerçeklik oluşmuyor.
 *
 * Tek istisna: GÜNLÜK PLAN storage'a yazılıyor (state.plan). Sebebi, planın
 * gün içinde sabit kalması gerektiği — kullanıcı soru çözdükçe zayıflık
 * oranları değişir ve plan yeniden hesaplanırsa hedefler gözünün önünde
 * oynar. Plan sabah bir kez kurulur, gün boyunca aynı kalır.
 */

import { DERS_REFERANS } from './kpss.js'

/** KPSS'de soru başına düşen ortalama süre: 120 soru / 130 dakika. */
export const TEMPO_SN = 65

/* Hiç çözülmemiş derse varsayılan başarı oranı. 0.45 seçildi: "bilmiyorum"
   kabul edilip plana girsin ama en zayıf dersin de önüne geçmesin. */
const VARSAYILAN_ORAN = 0.45

/* Günlük planda en fazla kaç ders gösterilecek. 14 dersin hepsine 3'er soru
   yazmak plan değil liste olur; 4 ders somut ve yapılabilir bir gün demek. */
const PLAN_DERS_SAYISI = 4
const PLAN_MIN_SORU = 5

const gunBasi = (ts = Date.now()) => {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Ders bazında çözüm sayısı ve doğru oranı — tüm geçmiş. */
export function dersPerformansi(cozulen) {
  const out = {}
  for (const v of Object.values(cozulen || {})) {
    if (!v?.dersId) continue
    const o = (out[v.dersId] ||= { toplam: 0, dogru: 0 })
    o.toplam++
    if (v.d) o.dogru++
  }
  for (const o of Object.values(out)) o.oran = o.toplam ? o.dogru / o.toplam : null
  return out
}

/**
 * Günlük planı ÜRETİR (kaydetmez).
 *
 * Ağırlık = sınavdaki soru sayısı × zayıflık katsayısı.
 *   - Sınav ağırlığı: 27 soruluk Tarih, 6 soruluk Güncel'den önemlidir.
 *   - Zayıflık: 1 + (1 − başarı oranı). Yani %40 yapan ders, %80 yapandan
 *     1,5 kat daha fazla soru alır. İkisi çarpılınca "hem çok soru geliyor
 *     hem de zayıfım" olan ders doğal olarak öne çıkar.
 */
export function planUret({ cozulen, dersler, gunlukHedef = 50 }) {
  const perf = dersPerformansi(cozulen)
  const listelenebilir = (dersler || []).filter((d) => {
    if (d.grup === 'gy' || d.grup === 'gk') return true
    /* Eğitim Bilimleri / Alan Bilgisi yalnızca kullanıcı oraya girdiyse
       plana dahil olur — herkese ÖABT yazmanın anlamı yok. */
    return (perf[d.id]?.toplam || 0) > 0
  })
  if (!listelenebilir.length) return []

  const agirlikli = listelenebilir
    .map((d) => {
      const p = perf[d.id]
      const oran = p?.toplam >= 5 ? p.oran : VARSAYILAN_ORAN
      const sinavSoru = DERS_REFERANS[d.id]?.soru || 10
      return { dersId: d.id, ad: d.ad, oran, zayiflik: 1 + (1 - oran), agirlik: sinavSoru * (1 + (1 - oran)) }
    })
    .sort((a, b) => b.agirlik - a.agirlik)
    .slice(0, PLAN_DERS_SAYISI)

  const toplamAgirlik = agirlikli.reduce((t, x) => t + x.agirlik, 0) || 1
  const hedef = {}
  for (const x of agirlikli) {
    hedef[x.dersId] = Math.max(PLAN_MIN_SORU, Math.round((gunlukHedef * x.agirlik) / toplamAgirlik / 5) * 5)
  }
  return { hedef, detay: agirlikli }
}

/** Plan + bugün yapılanları birleştirip görev listesi çıkarır. */
export function planGorevleri({ hedef, dersler, bugunSayilar }) {
  const adlar = Object.fromEntries((dersler || []).map((d) => [d.id, d.ad]))
  return Object.entries(hedef || {})
    .map(([dersId, adet]) => {
      const yapilan = bugunSayilar?.[dersId] || 0
      return {
        dersId,
        ad: adlar[dersId] || DERS_REFERANS[dersId]?.ad || dersId,
        hedef: adet,
        yapilan,
        kalan: Math.max(0, adet - yapilan),
        bitti: yapilan >= adet,
        oran: adet ? Math.min(100, Math.round((yapilan / adet) * 100)) : 0,
      }
    })
    .sort((a, b) => Number(a.bitti) - Number(b.bitti) || b.kalan - a.kalan)
}

/** Kullanıcının en son çalıştığı gün (bugün hariç) ve kaç gün ara verdiği. */
export function araDurumu(gunluk) {
  const gunler = Object.keys(gunluk || {})
    .filter((g) => (gunluk[g]?.soru || 0) > 0)
    .sort()
  if (!gunler.length) return { hicCalismamis: true, araGun: 0, sonGun: null }
  const son = gunler[gunler.length - 1]
  const fark = Math.round((gunBasi() - gunBasi(new Date(son + 'T00:00:00').getTime())) / 864e5)
  return { hicCalismamis: false, araGun: Math.max(0, fark), sonGun: son }
}

/**
 * Koçun o an söyleyeceği şey. Tek bir mesaj döner — üst üste üç uyarı
 * vermek kullanıcıyı bunaltır, koç gibi değil pano gibi hissettirir.
 */
export function kocMesaji({ gunluk, cozulen, tekrarSayisi = 0, bugunSoru = 0, gunlukHedef = 50, seri = 0 }) {
  const ara = araDurumu(gunluk)
  const toplam = Object.keys(cozulen || {}).length

  if (ara.hicCalismamis || toplam === 0)
    return {
      tur: 'yeni',
      baslik: 'Hoş geldin',
      metin: 'Bugün 10 soruyla başla. Hangi derste iyi olduğunu görmek için birkaç dersten karışık çöz; planı ona göre kuracağım.',
      aksiyon: { ad: 'İlk soruları çöz', yol: '/hizli' },
    }

  if (ara.araGun >= 2 && bugunSoru === 0)
    return {
      tur: 'ara',
      baslik: `${ara.araGun} gündür ara verdin`,
      metin:
        tekrarSayisi > 0
          ? `Kaldığın yerden devam edelim. Önce ${tekrarSayisi} tekrar sorusu bekliyor; unutmadan onları geçmek en hızlı toparlanma yolu.`
          : 'Kaldığın yerden devam edelim. Bugün az bir hedefle başla, tempoyu yarın yükseltiriz.',
      aksiyon: tekrarSayisi > 0 ? { ad: 'Tekrarı aç', yol: '/tekrar' } : { ad: 'Bugünkü plana git', yol: '/plan' },
    }

  if (tekrarSayisi > 0 && bugunSoru === 0)
    return {
      tur: 'tekrar',
      baslik: 'Güne tekrarla başla',
      metin: `${tekrarSayisi} soru tekrar zamanına geldi. Bunlar daha önce çözdüğün sorular; unutmadan hemen önce karşına çıkıyorlar.`,
      aksiyon: { ad: 'Tekrarı aç', yol: '/tekrar' },
    }

  if (bugunSoru >= gunlukHedef)
    return {
      tur: 'tamam',
      baslik: 'Bugünkü hedefi bitirdin',
      metin: `${bugunSoru} soru çözdün${seri > 1 ? ` · ${seri} günlük seri` : ''}. Fazladan çözeceksen en zayıf konularından devam et, oradaki her net daha çok kazandırır.`,
      aksiyon: { ad: 'Zayıf konularım', yol: '/analiz' },
    }

  const kalan = gunlukHedef - bugunSoru
  if (bugunSoru > 0)
    return {
      tur: 'devam',
      baslik: 'Devam et',
      metin: `Bugün ${bugunSoru} soru çözdün, hedefe ${kalan} soru kaldı.`,
      aksiyon: { ad: 'Plana dön', yol: '/plan' },
    }

  return {
    tur: 'gunluk',
    baslik: 'Bugüne başlayalım',
    metin: `Planında ${gunlukHedef} soru var. Zayıf olduğun derslere ağırlık verecek şekilde dağıttım.`,
    aksiyon: { ad: 'Bugünkü plan', yol: '/plan' },
  }
}

/**
 * İlerleme: "başlangıçta neredeydim, bugün neredeyim".
 * İlk ve son çözümlerden eşit büyüklükte iki pencere alıp karşılaştırır.
 * Az veriyle yanıltmamak için en az 40 soru şartı var.
 */
export function ilerleme(cozulen, esik = 40) {
  const kayitlar = Object.values(cozulen || {})
    .filter((v) => v?.t)
    .sort((a, b) => a.t - b.t)
  if (kayitlar.length < esik) return { yeterli: false, toplam: kayitlar.length, gereken: esik }

  const pencere = Math.max(20, Math.floor(kayitlar.length / 4))
  const ilk = kayitlar.slice(0, pencere)
  const son = kayitlar.slice(-pencere)
  const oranHesapla = (a) => Math.round((a.filter((x) => x.d).length / a.length) * 100)
  const ilkOran = oranHesapla(ilk)
  const sonOran = oranHesapla(son)
  const gunFark = Math.max(1, Math.round((kayitlar[kayitlar.length - 1].t - kayitlar[0].t) / 864e5))

  return {
    yeterli: true,
    toplam: kayitlar.length,
    pencere,
    ilkOran,
    sonOran,
    fark: sonOran - ilkOran,
    ilkTarih: kayitlar[0].t,
    sonTarih: kayitlar[kayitlar.length - 1].t,
    gunFark,
  }
}

/**
 * Deneme sonrası konu bazlı öneri.
 * Girdi: [{ konuId, dersId, dogruMu }] + konu adları haritası.
 * Çıktı: en çok yanlış yapılan konular, "şuna çalış" listesi.
 */
export function denemeOnerisi(sonuclar, konuAdlari = {}, dersAdlari = {}, limit = 4) {
  const harita = new Map()
  for (const s of sonuclar || []) {
    if (!s?.konuId) continue
    const anahtar = `${s.dersId}:${s.konuId}`
    const o = harita.get(anahtar) || { dersId: s.dersId, konuId: s.konuId, toplam: 0, yanlis: 0 }
    o.toplam++
    if (!s.dogruMu) o.yanlis++
    harita.set(anahtar, o)
  }
  return [...harita.values()]
    .filter((x) => x.yanlis > 0)
    .map((x) => ({
      ...x,
      ad: konuAdlari[`${x.dersId}:${x.konuId}`] || x.konuId,
      dersAd: dersAdlari[x.dersId] || x.dersId,
      oran: Math.round((x.yanlis / x.toplam) * 100),
    }))
    .sort((a, b) => b.yanlis - a.yanlis || b.oran - a.oran)
    .slice(0, limit)
}
