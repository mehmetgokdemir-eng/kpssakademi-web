/* Veri katmanı — /public/data altındaki JSON dosyalarını tembel yükler ve önbelleğe alır.
   Soru ve kart dosyaları ders bazında bölünmüştür; 16.000+ soru tek seferde indirilmez. */

const cache = new Map()
const inflight = new Map()

const BASE = '/data'

async function getJSON(path) {
  if (cache.has(path)) return cache.get(path)
  if (inflight.has(path)) return inflight.get(path)
  const p = fetch(`${BASE}/${path}`, { cache: 'no-cache' })
    .then(async (r) => {
      if (!r.ok) throw new Error(`${path} yüklenemedi (${r.status})`)
      const j = await r.json()
      cache.set(path, j)
      inflight.delete(path)
      return j
    })
    .catch((e) => {
      inflight.delete(path)
      throw e
    })
  inflight.set(path, p)
  return p
}

export const getIndex = () => getJSON('index.json')
export const getKonular = () => getJSON('konular.json')
export const getBilgiler = () => getJSON('bilgiler.json')
export const getDenemeler = () => getJSON('denemeler.json')
export const getDeneme = (id) => getJSON(`denemeler/${id}.json`)
// Bir dersin dosyası henüz yoksa (içerik aktarılmadıysa) hata yerine boş liste
// dönülür — arayüz "ders yok" yerine "bu derste henüz soru yok" gösterir.
export const getSorular = (dersId) => getJSON(`sorular/${dersId}.json`).catch(() => [])
export const getKartlar = (dersId) => getJSON(`kartlar/${dersId}.json`).catch(() => [])
export const getHarita = () => getJSON('oyunlar/harita.json')
export const getKronoloji = () => getJSON('oyunlar/kronoloji.json')
export const getEslestirme = () => getJSON('oyunlar/eslestirme.json')
export const getDogruMu = () => getJSON('oyunlar/dogrumu.json')

/** Bir dersin konu anlatımları */
export const getNotlar = (dersId) => getJSON(`notlar/${dersId}.json`).catch(() => [])

/** Tek bir konu anlatımı */
export async function getNot(dersId, konuId) {
  const n = await getNotlar(dersId)
  return n.find((x) => x.konuId === konuId) || null
}

/** Hangi derslerde konu anlatımı var, hangi konular kapsanmış */
export async function getAnlatimHaritasi() {
  const dersler = await getDersler()
  const cift = await Promise.all(
    dersler.filter((d) => d.notSayisi > 0).map(async (d) => [d.id, (await getNotlar(d.id)).map((n) => n.konuId)])
  )
  return Object.fromEntries(cift)
}

export async function getDersler() {
  const idx = await getIndex()
  return idx.dersler
}

export async function getDers(dersId) {
  const dersler = await getDersler()
  return dersler.find((d) => d.id === dersId) || null
}

export async function getKonularByDers(dersId) {
  const k = await getKonular()
  return k.filter((x) => x.dersId === dersId).sort((a, b) => (a.sira || 0) - (b.sira || 0))
}

/** Birden çok dersten soru toplar (quiz / karışık mod). */
export async function getSorularCoklu(dersIdler) {
  const listeler = await Promise.all(dersIdler.map((d) => getSorular(d).catch(() => [])))
  return listeler.flat()
}

/**
 * Verilen {id, dersId} çiftlerine göre soruları getirir.
 * Yalnızca gereken ders dosyaları indirilir — tüm banka (16 MB) yüklenmez.
 */
export async function getSorularByIdler(ciftler) {
  if (!ciftler?.length) return []
  const dersIdler = [...new Set(ciftler.map((c) => c.dersId).filter(Boolean))]
  const listeler = await Promise.all(dersIdler.map((d) => getSorular(d)))
  const map = new Map()
  for (const s of listeler.flat()) map.set(String(s.id), s)
  return ciftler.map((c) => map.get(String(c.id))).filter(Boolean)
}

/**
 * Quiz / Maraton için havuz. Tüm dersler istendiğinde HEPSİ indirilmez;
 * yeterli soru toplanana kadar dersler karıştırılıp sırayla yüklenir.
 */
export async function getHavuz(dersIdler, gerekenAdet = 20) {
  const secili = dersIdler?.length ? [...dersIdler] : (await getDersler()).map((d) => d.id)
  // Rastgele sırala — her seferinde farklı derslerden gelsin
  for (let i = secili.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[secili[i], secili[j]] = [secili[j], secili[i]]
  }
  const havuz = []
  const hedef = Math.max(gerekenAdet * 5, 200) // seçenek bolluğu için
  for (const d of secili) {
    havuz.push(...(await getSorular(d)))
    if (havuz.length >= hedef) break
  }
  return havuz
}

export function temizleOnbellek() {
  cache.clear()
}
