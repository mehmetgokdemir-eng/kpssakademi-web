/* KPSS puan hesaplama.

   Gerçek ÖSYM hesabı standart puana (ortalama 50, ss 10) dayanır ve aday
   kitlesinin ham puan dağılımını gerektirir. Uygulama içinde bu dağılım
   bilinemeyeceği için, geçmiş yıl sınav istatistiklerinden türetilmiş
   referans ortalama/standart sapma değerleri kullanılır. Sonuç bir
   tahmindir; ÖSYM'nin resmî sonucu ile birebir aynı olmayabilir.
*/

// Ders bazlı referans değerler: ortalama net ve net standart sapması.
// Standart sapması yüksek dersler (Matematik) puana daha fazla etki eder.
export const DERS_REFERANS = {
  turkce: { ad: 'Türkçe', soru: 30, ortalamaNet: 16.5, ss: 6.4 },
  matematik: { ad: 'Matematik', soru: 30, ortalamaNet: 8.2, ss: 7.8 },
  tarih: { ad: 'Tarih', soru: 27, ortalamaNet: 12.8, ss: 5.9 },
  cografya: { ad: 'Coğrafya', soru: 18, ortalamaNet: 8.9, ss: 4.1 },
  vatandaslik: { ad: 'Vatandaşlık', soru: 9, ortalamaNet: 4.8, ss: 2.2 },
  guncel: { ad: 'Güncel Bilgiler', soru: 6, ortalamaNet: 2.4, ss: 1.6 },
  egitimbilimleri: { ad: 'Eğitim Bilimleri', soru: 80, ortalamaNet: 38.0, ss: 14.5 },
}

export const GRUPLAR = {
  gy: ['turkce', 'matematik'],
  gk: ['tarih', 'cografya', 'vatandaslik', 'guncel'],
  eb: ['egitimbilimleri'],
}

// Puan türü ağırlıkları (test bazlı toplam ağırlık = 1)
// Ağırlıklar ÖSYM puan türü tanımlarına göre. Değiştirmeden önce güncel
// KPSS kılavuzuyla teyit edin — ÖSYM zaman zaman puan türü ekler/çıkarır.
export const PUAN_TURLERI = {
  P1: { ad: 'P1 (Lisans - GY %70 + GK %30)', agirlik: { gy: 0.7, gk: 0.3 } },
  P2: { ad: 'P2 (Lisans - GY %60 + GK %40)', agirlik: { gy: 0.6, gk: 0.4 } },
  P3: { ad: 'P3 (Lisans - GY %50 + GK %50)', agirlik: { gy: 0.5, gk: 0.5 } },
  P93: { ad: 'P93 (Ön Lisans - GY %50 + GK %50)', agirlik: { gy: 0.5, gk: 0.5 } },
  P10: { ad: 'P10 (Öğretmenlik - GY %30 + GK %30 + EB %40)', agirlik: { gy: 0.3, gk: 0.3, eb: 0.4 } },
  P121: { ad: 'P121 (Öğretmenlik - GY %15 + GK %15 + EB %20 + ÖABT %50)', agirlik: { gy: 0.15, gk: 0.15, eb: 0.2 }, oabt: 0.5 },
}

export const TABAN_PUAN = 60 // Ham 0 net alan adayın yaklaşık taban puanı

export const net = (dogru, yanlis) => Math.max(0, dogru - yanlis / 4)

/** Ham neti standart puana çevirir (ortalama 50, standart sapma 10). */
export function standartPuan(netDeger, ders) {
  const ref = DERS_REFERANS[ders]
  if (!ref || !ref.ss) return 50
  const z = (netDeger - ref.ortalamaNet) / ref.ss
  return Math.max(0, Math.min(100, 50 + 10 * z))
}

/**
 * @param {Object} netler  { turkce: 20, matematik: 12, ... }
 * @param {string} puanTuru
 * @param {number} oabtNetYuzde  0..100 (yalnızca P121)
 */
export function kpssPuan(netler, puanTuru = 'P3', oabtNetYuzde = null) {
  const tur = PUAN_TURLERI[puanTuru] || PUAN_TURLERI.P3
  let toplam = 0
  const detay = {}
  for (const [grup, agirlik] of Object.entries(tur.agirlik)) {
    const dersler = GRUPLAR[grup] || []
    const toplamSoru = dersler.reduce((a, d) => a + (DERS_REFERANS[d]?.soru || 0), 0)
    let grupPuan = 0
    for (const d of dersler) {
      const sp = standartPuan(netler[d] ?? 0, d)
      const pay = (DERS_REFERANS[d]?.soru || 0) / (toplamSoru || 1)
      grupPuan += sp * pay
      detay[d] = Math.round(sp * 10) / 10
    }
    toplam += grupPuan * agirlik
  }
  if (puanTuru === 'P121' && oabtNetYuzde != null) {
    const sp = Math.max(0, Math.min(100, 50 + 10 * ((oabtNetYuzde - 45) / 18)))
    toplam += sp * (tur.oabt || 0)
    detay.oabt = Math.round(sp * 10) / 10
  }
  // 0-100 standart puanı KPSS ölçeğine taşı (yaklaşık 60-90 aralığı)
  const puan = TABAN_PUAN + toplam * 0.6
  return { puan: Math.round(puan * 1000) / 1000, detay }
}

/** Hedef puana ulaşmak için gereken net dağılımını önerir. */
export function hedefIcinNet(hedefPuan, puanTuru = 'P3', mevcut = {}) {
  const dersler = Object.values(GRUPLAR[('' + puanTuru) === 'P10' ? 'eb' : 'gy']).flat()
  const tur = PUAN_TURLERI[puanTuru] || PUAN_TURLERI.P3
  const kullanilan = Object.keys(tur.agirlik).flatMap((g) => GRUPLAR[g] || [])
  const netler = {}
  for (const d of kullanilan) netler[d] = mevcut[d] ?? DERS_REFERANS[d].ortalamaNet

  // Basit artımlı arama: puan hedefe ulaşana kadar en verimli derse net ekle
  let guvenlik = 0
  while (kpssPuan(netler, puanTuru).puan < hedefPuan && guvenlik < 4000) {
    let enIyi = null
    let enIyiKazanc = 0
    for (const d of kullanilan) {
      if (netler[d] >= DERS_REFERANS[d].soru) continue
      const dene = { ...netler, [d]: netler[d] + 1 }
      const kazanc = kpssPuan(dene, puanTuru).puan - kpssPuan(netler, puanTuru).puan
      if (kazanc > enIyiKazanc) {
        enIyiKazanc = kazanc
        enIyi = d
      }
    }
    if (!enIyi) break
    netler[enIyi] += 1
    guvenlik++
  }
  return { netler, ulasilan: kpssPuan(netler, puanTuru).puan, mumkun: kpssPuan(netler, puanTuru).puan >= hedefPuan, dersler }
}

/** Bir dersin 1 netinin puana katkısı — "hangi ders daha çok kazandırıyor". */
export function netBasinaKatki(puanTuru = 'P3', taban = {}) {
  const tur = PUAN_TURLERI[puanTuru] || PUAN_TURLERI.P3
  const dersler = Object.keys(tur.agirlik).flatMap((g) => GRUPLAR[g] || [])
  const base = {}
  for (const d of dersler) base[d] = taban[d] ?? DERS_REFERANS[d].ortalamaNet
  const p0 = kpssPuan(base, puanTuru).puan
  return dersler
    .map((d) => ({
      dersId: d,
      ad: DERS_REFERANS[d].ad,
      katki: Math.round((kpssPuan({ ...base, [d]: base[d] + 1 }, puanTuru).puan - p0) * 1000) / 1000,
    }))
    .sort((a, b) => b.katki - a.katki)
}
