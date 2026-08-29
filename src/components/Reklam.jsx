/**
 * Reklam alanı — GEÇİCİ OLARAK DEVRE DIŞI.
 *
 * AdSense reklam kodu, hesap onayı / itiraz süreci için siteden tamamen
 * kaldırıldı (index.html'deki yükleyici betik ve statik sayfalardaki kod
 * dahil). Bu bileşen hiçbir şey render etmiyor; sayfalardaki <Reklam />
 * çağrıları olduğu yerde durabilir, çıktı üretmezler.
 *
 * Yeniden açmak için: index.html'e AdSense yükleyici betiğini geri ekle,
 * src/lib/reklam.js içindeki SLOTLAR'ı doldur ve bu dosyanın eski sürümünü
 * (reklam birimi push eden <ins>) geri getir.
 */
export default function Reklam() {
  return null
}
