/* Kalıcı ilerleme deposu — localStorage tabanlı, tek anahtar altında toplanır.
   Android uygulamasındaki Room/DataStore karşılığı. */

const KEY = 'ka:progress:v1'
const listeners = new Set()

const emptyState = () => ({
  cozulen: {}, // soruId -> { d: 0|1 (doğru mu), t: timestamp, dersId, konuId }
  yanlislar: {}, // soruId -> timestamp
  kayitlilar: {}, // soruId -> timestamp
  notlar: {}, // soruId -> { metin, t }
  kartlar: {}, // kartId -> { bilinen: bool, t }
  gunluk: {}, // 'YYYY-MM-DD' -> { soru: n, dogru: n, sure: sn }
  denemeler: [], // { denemeId, ad, tarih, dogru, yanlis, bos, net, puan, puanTuru, detay:{dersId:{d,y,b}} }
  oyun: {}, // oyunId -> { oynanan: n, enIyi: n, sonSkor: n }
  quiz: { puan: 0, oynanan: 0 },
  seri: { son: null, gun: 0 }, // çalışma serisi
})

let state = load()

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    return { ...emptyState(), ...JSON.parse(raw) }
  } catch {
    return emptyState()
  }
}

let saveTimer = null
function persist() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch (e) {
      // kota dolarsa en eski günlük kayıtları at
      try {
        const gunler = Object.keys(state.gunluk).sort()
        while (gunler.length > 120) delete state.gunluk[gunler.shift()]
        localStorage.setItem(KEY, JSON.stringify(state))
      } catch {}
    }
  }, 250)
}

function emit() {
  listeners.forEach((fn) => fn(state))
  persist()
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function getState() {
  return state
}

export const bugun = () => new Date().toISOString().slice(0, 10)

function gunKaydi() {
  const g = bugun()
  if (!state.gunluk[g]) state.gunluk[g] = { soru: 0, dogru: 0, sure: 0 }
  return state.gunluk[g]
}

function seriGuncelle() {
  const g = bugun()
  const s = state.seri
  if (s.son === g) return
  const dun = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
  s.gun = s.son === dun ? s.gun + 1 : 1
  s.son = g
}

/* --- Soru cevaplama --- */
export function cevapKaydet({ soruId, dersId, konuId, dogruMu, sureSn = 0 }) {
  state.cozulen[soruId] = { d: dogruMu ? 1 : 0, t: Date.now(), dersId, konuId }
  if (dogruMu) delete state.yanlislar[soruId]
  else state.yanlislar[soruId] = { t: Date.now(), dersId }
  const g = gunKaydi()
  g.soru += 1
  if (dogruMu) g.dogru += 1
  g.sure += sureSn
  seriGuncelle()
  emit()
}

export function cozumTemizle(soruId) {
  delete state.cozulen[soruId]
  delete state.yanlislar[soruId]
  emit()
}

export function sifirlaDers(dersId) {
  for (const [id, v] of Object.entries(state.cozulen)) {
    if (v.dersId === dersId) {
      delete state.cozulen[id]
      delete state.yanlislar[id]
    }
  }
  emit()
}

/* --- Kaydetme / not --- */
/* dersId birlikte saklanır: liste ekranları yalnızca ilgili ders dosyasını
   indirir, 16 MB'lık tüm soru bankasını taramaya gerek kalmaz. */
export function kayitToggle(soruId, dersId) {
  if (state.kayitlilar[soruId]) delete state.kayitlilar[soruId]
  else state.kayitlilar[soruId] = { t: Date.now(), dersId: dersId || state.cozulen[soruId]?.dersId }
  emit()
  return !!state.kayitlilar[soruId]
}

export function notKaydet(soruId, metin, dersId) {
  if (!metin || !metin.trim()) delete state.notlar[soruId]
  else
    state.notlar[soruId] = {
      metin: metin.trim(),
      t: Date.now(),
      dersId: dersId || state.notlar[soruId]?.dersId || state.cozulen[soruId]?.dersId,
    }
  emit()
}

/** Bir listedeki soru id'lerini dersleriyle birlikte döndürür. */
export function idDersCiftleri(kaynak) {
  const m = kaynak === 'yanlislar' ? state.yanlislar : kaynak === 'kayitlilar' ? state.kayitlilar : state.notlar
  return Object.keys(m).map((id) => ({
    id,
    dersId: (typeof m[id] === 'object' ? m[id].dersId : null) || state.cozulen[id]?.dersId || null,
  }))
}

/* --- Kartlar --- */
export function kartIsaretle(kartId, bilinen = true) {
  state.kartlar[kartId] = { bilinen, t: Date.now() }
  emit()
}

/* --- Quiz --- */
export function quizPuanEkle(p = 1) {
  state.quiz.puan += p
  state.quiz.oynanan += 1
  emit()
}

/* --- Denemeler --- */
export function denemeKaydet(sonuc) {
  state.denemeler.unshift({ ...sonuc, tarih: Date.now() })
  state.denemeler = state.denemeler.slice(0, 100)
  seriGuncelle()
  emit()
}

/* --- Oyunlar --- */
export function oyunSkor(oyunId, skor) {
  const o = state.oyun[oyunId] || { oynanan: 0, enIyi: 0, sonSkor: 0 }
  o.oynanan += 1
  o.sonSkor = skor
  o.enIyi = Math.max(o.enIyi, skor)
  state.oyun[oyunId] = o
  emit()
}

/* --- Toplu --- */
export function hepsiniSifirla() {
  state = emptyState()
  emit()
}

export function disaAktar() {
  return JSON.stringify({ surum: 1, tarih: new Date().toISOString(), veri: state }, null, 2)
}

export function iceAktar(json) {
  const p = JSON.parse(json)
  if (!p || !p.veri) throw new Error('Geçersiz yedek dosyası')
  state = { ...emptyState(), ...p.veri }
  emit()
}

/* --- Türetilmiş istatistikler --- */
export function dersIstatistik(dersId) {
  let toplam = 0
  let dogru = 0
  for (const v of Object.values(state.cozulen)) {
    if (v.dersId === dersId) {
      toplam++
      if (v.d) dogru++
    }
  }
  return { toplam, dogru, yanlis: toplam - dogru, oran: toplam ? Math.round((dogru / toplam) * 100) : 0 }
}

export function genelIstatistik() {
  const vals = Object.values(state.cozulen)
  const dogru = vals.filter((v) => v.d).length
  const dersDagilim = {}
  for (const v of vals) dersDagilim[v.dersId] = (dersDagilim[v.dersId] || 0) + 1
  return {
    toplam: vals.length,
    dogru,
    yanlis: vals.length - dogru,
    oran: vals.length ? Math.round((dogru / vals.length) * 100) : 0,
    dersDagilim,
    kartBilinen: Object.values(state.kartlar).filter((k) => k.bilinen).length,
    seri: state.seri.gun,
  }
}

export function sonNGun(n = 7) {
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)
    out.push({ gun: d, ...(state.gunluk[d] || { soru: 0, dogru: 0, sure: 0 }) })
  }
  return out
}
