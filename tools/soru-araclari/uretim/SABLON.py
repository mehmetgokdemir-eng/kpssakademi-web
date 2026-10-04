# -*- coding: utf-8 -*-
"""Zor soru yazim sablonu ve kalite olcutleri.

ZOR SORU NEDIR (bu bankada):
  - Tek bir tanimi hatirlamakla cozulemez; iki kavrami karsilastirmak,
    bir kurali yeni bir olaya uygulamak ya da nedensellik kurmak gerekir.
  - Celdiriciler "acikca yanlis" degil, "yaygin yanlis inanis" olmalidir.
  - Her celdirici bir kavram yanilgisini temsil etmelidir.

CELDIRICI KURALLARI:
  1. Dogru sik EN UZUN OLMAYACAK (fabrika bunu reddeder).
  2. "tumuyle / her zaman / asla / hicbir bicimde" gibi mutlak ifadeleri
     celdiricilere yigmayin; dogru sikta da zaman zaman gecebilir.
  3. Celdiriciler birbirine benzer uzunlukta ve ayni dilbilgisi kalibinda olsun.
  4. Ek cumleler noktadan SONRA yapistirilmaz; cumleye entegre edilir.

SORULARIN BICIMI:
SORULAR = [
 ("konuId", "zor",
  "Soru koku ...?",
  ["A secenegi", "B secenegi", "C secenegi", "D secenegi", "E secenegi"],
  2,   # dogru secenegin indeksi (0-4)
  "Aciklama: dogru sikkin neden dogru, en yaygin celdiricinin neden yanlis oldugu."),
]
"""
SORULAR = []

# ---------------------------------------------------------------
# DOGAL VARYASYON (7. alan)
# Her soruda dogru sikki celdiricilerden kisa tutmak, zamanla
# "en kisayi sec" biciminde TERS bir sizinti yaratir. Bu yuzden
# her partide sorularin en cok %35'inde dogru sik en uzun olabilir.
# Boyle bir soruda 7. alana True yazilir:
#
#   ("konuId", "zor", "Soru ...?", [...], 0, "Aciklama ...", True),
#
# Fabrika bu orani asan partileri reddeder.
