/* Otomatik reklam denetimi — GEÇİCİ OLARAK İŞLEVSİZ.
 *
 * AdSense reklam kodu (yükleyici betik ve reklam birimleri) hesap onayı /
 * itiraz süreci için siteden tamamen kaldırıldı. Ortada otomatik reklam
 * kalmadığı için bu yedek katmanın da yapacağı bir iş yok; bileşen hiçbir
 * şey yapmadan duruyor. App.jsx'teki import'un kırılmaması için dosya
 * korunuyor.
 *
 * Reklamlar geri açıldığında bu dosyanın eski sürümü (yasaklı rotalarda
 * Google'ın otomatik yerleştirdiği kapsayıcıları kaldıran MutationObserver)
 * geri getirilmelidir.
 */

export default function OtomatikReklamKontrol() {
  return null
}
