/* Türkiye haritası + coğrafya oyun verisi üretimi.
   Gerçek enlem/boylam değerleri basit bir eşdikdörtgen (equirectangular)
   projeksiyonla SVG koordinatlarına çevrilir; böylece harita çizimi ile
   üzerindeki işaretler aynı koordinat sisteminde kalır. */

const LON_MIN = 25.5
const LON_MAX = 45.5
const LAT_MIN = 35.6
const LAT_MAX = 42.4
const LAT0 = 39 // ölçek düzeltmesi için referans enlem

export const GENISLIK = 1000
export const YUKSEKLIK = Math.round(
  (GENISLIK * (LAT_MAX - LAT_MIN)) / ((LON_MAX - LON_MIN) * Math.cos((LAT0 * Math.PI) / 180))
)

export const izdusum = ([lon, lat]) => [
  +(((lon - LON_MIN) / (LON_MAX - LON_MIN)) * GENISLIK).toFixed(1),
  +(((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * YUKSEKLIK).toFixed(1),
]

/* Türkiye kara sınırı — kabaca sadeleştirilmiş kıyı ve kara sınırı noktaları
   (saat yönünde: Trakya → Karadeniz → doğu sınırı → güney sınırı → Akdeniz → Ege) */
const SINIR = [
  // Trakya
  [26.05, 40.73], [26.35, 41.71], [27.55, 41.95], [28.02, 41.98],
  // Karadeniz kıyısı
  [29.1, 41.22], [30.3, 41.12], [31.42, 41.28], [32.3, 41.83], [33.55, 42.02],
  [35.15, 42.03], [36.05, 41.7], [36.33, 41.35], [37.88, 40.98], [39.73, 41.0],
  [40.55, 41.15], [41.42, 41.42],
  // Doğu sınırı
  [42.6, 41.55], [43.45, 41.2], [43.6, 40.55], [44.05, 40.03], [44.82, 39.65],
  [44.35, 39.4], [44.29, 38.4], [44.05, 37.85], [44.62, 37.42], [44.79, 37.15],
  // Güney sınırı (Irak / Suriye)
  [42.4, 37.3], [41.2, 37.07], [40.0, 36.9], [38.95, 36.7], [37.9, 36.83],
  [36.66, 36.85], [36.66, 36.2], [36.16, 35.92],
  // Akdeniz kıyısı
  [35.92, 36.6], [35.55, 36.55], [34.63, 36.8], [34.05, 36.3], [32.83, 36.02],
  [32.0, 36.54], [31.4, 36.8], [30.7, 36.88], [30.55, 36.31], [29.64, 36.2],
  [29.1, 36.65],
  // Ege kıyısı
  [28.27, 36.85], [27.43, 37.03], [27.26, 37.86], [26.8, 38.4], [26.3, 38.32],
  [26.75, 38.67], [26.7, 39.31], [26.18, 39.55], [26.4, 40.15], [26.05, 40.73],
]

export const yol = () => 'M' + SINIR.map(izdusum).map(([x, y]) => `${x},${y}`).join(' L') + ' Z'

/* Coğrafya oyunu kategorileri — enlem/boylam olarak tanımlanır, projeksiyon uygulanır. */
const KATEGORILER = [
  {
    id: 'volkanik-daglar',
    ad: 'Volkanik Dağlar',
    ogeler: [
      ['Ağrı Dağı', 44.3, 39.7],
      ['Süphan Dağı', 42.83, 38.92],
      ['Nemrut Dağı (Bitlis)', 42.23, 38.65],
      ['Tendürek Dağı', 43.87, 39.37],
      ['Erciyes Dağı', 35.45, 38.53],
      ['Hasan Dağı', 34.17, 38.13],
      ['Melendiz Dağı', 34.5, 38.3],
      ['Karacadağ', 39.8, 37.7],
      ['Karadağ (Karaman)', 33.35, 37.4],
      ['Kula Volkanik Alanı', 28.65, 38.55],
    ],
  },
  {
    id: 'kivrim-daglar',
    ad: 'Kıvrım Dağları',
    ogeler: [
      ['Toros Dağları', 33.2, 37.1],
      ['Bolkar Dağları', 34.5, 37.4],
      ['Aladağlar', 35.2, 37.85],
      ['Bey Dağları', 30.3, 36.6],
      ['Sultan Dağları', 31.3, 38.4],
      ['Küre Dağları', 33.4, 41.6],
      ['Ilgaz Dağları', 33.7, 41.05],
      ['Canik Dağları', 36.6, 40.9],
      ['Munzur Dağları', 39.3, 39.4],
      ['Cilo-Sat Dağları', 44.0, 37.5],
      ['Yalnızçam Dağları', 42.3, 41.1],
    ],
  },
  {
    id: 'kirik-daglar',
    ad: 'Kırık (Horst) Dağları',
    ogeler: [
      ['Kazdağı', 26.9, 39.7],
      ['Madra Dağı', 27.3, 39.4],
      ['Yunt Dağı', 27.4, 38.85],
      ['Bozdağlar', 28.1, 38.35],
      ['Aydın Dağları', 27.8, 37.95],
      ['Menteşe Dağları', 28.5, 37.2],
      ['Uludağ', 29.22, 40.1],
      ['Yıldız (Istranca) Dağları', 27.6, 41.8],
    ],
  },
  {
    id: 'akarsular',
    ad: 'Akarsular',
    ogeler: [
      ['Kızılırmak', 35.0, 40.2],
      ['Yeşilırmak', 36.5, 40.6],
      ['Sakarya', 30.7, 40.6],
      ['Fırat', 38.6, 38.6],
      ['Dicle', 40.6, 37.6],
      ['Aras', 43.4, 40.05],
      ['Çoruh', 41.4, 40.9],
      ['Meriç', 26.5, 41.2],
      ['Gediz', 27.5, 38.6],
      ['Büyük Menderes', 27.9, 37.7],
      ['Küçük Menderes', 27.4, 38.15],
      ['Seyhan', 35.3, 37.2],
      ['Ceyhan', 35.9, 37.2],
      ['Göksu', 33.6, 36.7],
      ['Asi', 36.3, 36.4],
      ['Susurluk (Simav)', 28.2, 40.1],
      ['Manavgat', 31.45, 36.9],
      ['Dalaman', 28.85, 36.9],
    ],
  },
  {
    id: 'goller',
    ad: 'Göller',
    ogeler: [
      ['Van Gölü', 43.0, 38.65],
      ['Tuz Gölü', 33.4, 38.75],
      ['Beyşehir Gölü', 31.5, 37.75],
      ['Eğirdir Gölü', 30.87, 38.05],
      ['Burdur Gölü', 30.15, 37.73],
      ['Acıgöl', 29.87, 37.8],
      ['İznik Gölü', 29.5, 40.44],
      ['Sapanca Gölü', 30.25, 40.7],
      ['Manyas (Kuş) Gölü', 28.0, 40.19],
      ['Ulubat Gölü', 28.6, 40.17],
      ['Çıldır Gölü', 43.3, 41.05],
      ['Tortum Gölü', 41.65, 40.65],
      ['Salda Gölü', 29.68, 37.55],
      ['Hazar Gölü', 39.4, 38.48],
      ['Meke Gölü', 33.64, 37.68],
    ],
  },
  {
    id: 'ovalar',
    ad: 'Ovalar',
    ogeler: [
      ['Çukurova', 35.4, 37.0],
      ['Konya Ovası', 32.6, 37.9],
      ['Bafra Ovası', 35.9, 41.5],
      ['Çarşamba Ovası', 36.72, 41.15],
      ['Amik Ovası', 36.4, 36.35],
      ['Harran Ovası', 39.0, 36.95],
      ['Iğdır Ovası', 44.0, 39.9],
      ['Muş Ovası', 41.5, 38.72],
      ['Erzincan Ovası', 39.5, 39.75],
      ['Bursa Ovası', 29.06, 40.2],
      ['Söke Ovası', 27.4, 37.75],
      ['Gediz Ovası', 27.4, 38.6],
      ['Silifke (Göksu) Ovası', 33.93, 36.4],
    ],
  },
  {
    id: 'platolar',
    ad: 'Platolar',
    ogeler: [
      ['Obruk Platosu', 33.2, 38.0],
      ['Cihanbeyli Platosu', 32.9, 38.65],
      ['Haymana Platosu', 32.5, 39.4],
      ['Bozok Platosu', 35.2, 39.6],
      ['Uzunyayla Platosu', 36.5, 38.9],
      ['Taşeli Platosu', 33.2, 36.8],
      ['Gaziantep Platosu', 37.4, 37.1],
      ['Şanlıurfa Platosu', 39.0, 37.4],
      ['Çatalca-Kocaeli Platosu', 29.3, 41.1],
    ],
  },
  {
    id: 'lav-platolari',
    ad: 'Lav (Volkanik) Platoları',
    ogeler: [
      ['Erzurum-Kars Platosu', 42.0, 40.35],
      ['Ardahan Platosu', 42.9, 41.1],
      ['Karacadağ Platosu', 39.85, 37.75],
      ['Ürgüp-Göreme (Nevşehir) Platosu', 34.85, 38.65],
      ['Gaziantep Yaylası', 37.2, 37.3],
    ],
  },
]

export function haritaVerisi() {
  return {
    viewBox: `0 0 ${GENISLIK} ${YUKSEKLIK}`,
    path: yol(),
    kategoriler: KATEGORILER.map((k) => ({
      id: k.id,
      ad: k.ad,
      ogeler: k.ogeler.map(([ad, lon, lat]) => {
        const [x, y] = izdusum([lon, lat])
        return { ad, x, y }
      }),
    })),
  }
}
