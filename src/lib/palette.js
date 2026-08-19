/* Kategorik grafik/ders paleti.
   Sıra CVD (renk körlüğü) güvenliği için sabittir — döngüye sokulmaz, karıştırılmaz.
   Doğrulama (dataviz validator):
     açık tema, yüzey #f6f7f9 → tüm kontroller PASS (kontrast uyarısı doğrudan
       etiketlerle karşılanır: her barın yanında ders adı + sayı yazılır)
     koyu tema, yüzey #12141f → tüm kontroller PASS
*/
export const SERI = [
  { ad: 'mavi', acik: '#2a78d6', koyu: '#3987e5' },
  { ad: 'turuncu', acik: '#eb6834', koyu: '#d95926' },
  { ad: 'deniz', acik: '#1baf7a', koyu: '#199e70' },
  { ad: 'sari', acik: '#eda100', koyu: '#c98500' },
  { ad: 'macenta', acik: '#e87ba4', koyu: '#d55181' },
  { ad: 'yesil', acik: '#008300', koyu: '#008300' },
  { ad: 'menekse', acik: '#4a3aa7', koyu: '#9085e9' },
  { ad: 'kirmizi', acik: '#e34948', koyu: '#e66767' },
]

/** Slot rengini temaya göre döndürür. 8'den sonrası "Diğer" grisine düşer. */
export function seriRenk(i, koyuMu = false) {
  if (i < 0 || i >= SERI.length) return koyuMu ? '#898781' : '#898781'
  return koyuMu ? SERI[i].koyu : SERI[i].acik
}

/** Grafik krom renkleri */
export const KROM = {
  acik: { yuzey: '#f6f7f9', izgara: '#e1e0d9', eksen: '#c3c2b7', mürekkep: '#0b0b0b', ikincil: '#52514e', soluk: '#898781' },
  koyu: { yuzey: '#12141f', izgara: '#2c2c2a', eksen: '#383835', mürekkep: '#ffffff', ikincil: '#c3c2b7', soluk: '#898781' },
}

/** Durum renkleri — seri renkleriyle karıştırılmaz, ikon/etiketle birlikte kullanılır. */
export const DURUM = {
  iyi: '#0ca30c',
  uyari: '#fab219',
  ciddi: '#ec835a',
  kritik: '#d03b3b',
}
