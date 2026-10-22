// Denemeleri soru bankasına göre tazeler.
//  - Denemenin içindeki soru kopyaları bankadaki güncel haliyle değiştirilir
//    (düzeltilen anahtarlar, yeniden yazılan açıklamalar denemelere de geçer).
//  - Bankadan çıkarılmış sorular, aynı dersten sağlam bir soruyla değiştirilir;
//    öncelik aynı konu ve aynı zorluk, sonra aynı konu, sonra aynı zorluk.
//  - Soru sayısı, bölüm yapısı, deneme bilgileri değişmez.
//
// Çalıştırma:  node tools/deneme-onar.mjs          (sadece rapor)
//              node tools/deneme-onar.mjs --yaz    (dosyaları günceller)
import fs from "node:fs";
import path from "node:path";

const kok = path.resolve("public/data");
const soruKlasor = path.join(kok, "sorular");
const denemeKlasor = path.join(kok, "denemeler");
const yaz = process.argv.includes("--yaz");
const eskiSil = process.argv.includes("--eski-sil");
const oku = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const ALANLAR = ["id", "dersId", "konuId", "soru", "secenekler", "dogru", "aciklama", "zorluk"];
const sadeSoru = (s, ders) => {
  const c = {};
  for (const a of ALANLAR) c[a] = a === "dersId" ? (s.dersId || ders) : s[a];
  c.id = String(c.id);
  return c;
};

// Banka
const dersSoru = {};
const bankaId = new Map();
for (const ad of fs.readdirSync(soruKlasor).filter((a) => a.endsWith(".json"))) {
  const ders = ad.replace(/\.json$/, "");
  const liste = oku(path.join(soruKlasor, ad)).map((s) => sadeSoru(s, ders));
  liste.sort((a, b) => Number(a.id) - Number(b.id));
  dersSoru[ders] = liste;
  for (const s of liste) bankaId.set(s.id, s);
}
console.log(`Banka: ${bankaId.size} soru, ${Object.keys(dersSoru).length} ders\n`);

// Eski id'den sapmasız bir başlangıç noktası üret (her çalıştırmada aynı sonuç)
const tohum = (metin) => {
  let h = 2166136261;
  for (let i = 0; i < metin.length; i++) { h ^= metin.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};

function yedekSoru(ders, eski, kullanilan) {
  const havuz = dersSoru[ders] || [];
  const sirali = [
    (s) => s.konuId === eski.konuId && s.zorluk === eski.zorluk,
    (s) => s.konuId === eski.konuId,
    (s) => s.zorluk === eski.zorluk,
    () => true,
  ];
  for (const olcut of sirali) {
    const adaylar = havuz.filter((s) => olcut(s) && !kullanilan.has(s.id));
    if (adaylar.length) return adaylar[tohum(String(eski.id)) % adaylar.length];
  }
  return null;
}

let dosya = 0, tazelenen = 0, degisen = 0, eklenen = 0, bulunamayan = 0;
const rapor = [];
const eskiler = [];   // bankayla hiç ilgisi olmayan eski örnek denemeler

for (const ad of fs.readdirSync(denemeKlasor).filter((a) => a.endsWith(".json"))) {
  const yol = path.join(denemeKlasor, ad);
  const deneme = oku(yol);
  if (!deneme.bolumler) continue;
  dosya++;

  const tumId = [];
  for (const b of deneme.bolumler) for (const s of b.sorular || []) tumId.push(String(s.id));
  // Eski örnek verisi: id'leri "s00001" gibi, bankadaki hiçbir soruyla ilgisi yok
  const bankada = tumId.filter((i) => bankaId.has(i)).length;
  if (tumId.length && bankada === 0) {
    eskiler.push({ ad, yol, soru: tumId.length, ornek: tumId[0] });
    continue;
  }

  const kullanilan = new Set(tumId);

  let buDegisen = 0, buEklenen = 0;
  for (const bolum of deneme.bolumler) {
    const ders = bolum.dersId;
    bolum.sorular = (bolum.sorular || []).map((eski) => {
      const id = String(eski.id);
      const guncel = bankaId.get(id);
      if (guncel) {
        const ayni = JSON.stringify(sadeSoru(eski, ders)) === JSON.stringify(guncel);
        if (!ayni) { buDegisen++; degisen++; }
        return guncel;
      }
      const yeni = yedekSoru(ders, eski, kullanilan);
      if (!yeni) { bulunamayan++; return eski; }
      kullanilan.delete(id);
      kullanilan.add(yeni.id);
      buEklenen++; eklenen++;
      return yeni;
    });
  }
  if (buDegisen || buEklenen) {
    tazelenen++;
    rapor.push(`  ${ad.padEnd(26)} ${String(buEklenen).padStart(2)} soru değişti, ${String(buDegisen).padStart(3)} soru tazelendi`);
    if (yaz) fs.writeFileSync(yol, JSON.stringify(deneme, null, 1) + "\n", "utf8");
  }
}

console.log(`${dosya} deneme tarandı, ${tazelenen} tanesinde değişiklik var:\n`);
console.log(rapor.join("\n"));
console.log(`\nToplam: ${eklenen} çıkarılmış soru yenisiyle değiştirildi, ${degisen} soru bankadaki güncel haliyle tazelendi.`);

if (eskiler.length) {
  console.log(`\n${eskiler.length} dosya ESKİ ÖRNEK VERİSİ (soruları bankada hiç yok, id'leri "${eskiler[0].ornek}" biçiminde):`);
  for (const e of eskiler) console.log(`  ${e.ad.padEnd(26)} ${e.soru} soru`);
  console.log("  Bunlar ilk kurulumdan kalma demo denemeler; gerçek denemelerle içerikleri örtüşüyor.");
  if (eskiSil) {
    const indeksYolu = path.join(kok, "denemeler.json");
    let indeks = fs.existsSync(indeksYolu) ? oku(indeksYolu) : null;
    for (const e of eskiler) {
      if (yaz) fs.unlinkSync(e.yol);
      console.log(`  silindi: ${e.ad}`);
    }
    if (indeks) {
      const silinecek = new Set(eskiler.map((e) => e.ad.replace(/\.json$/, "")));
      const once = indeks.length;
      indeks = indeks.filter((d) => !silinecek.has(d.id));
      if (yaz) fs.writeFileSync(indeksYolu, JSON.stringify(indeks, null, 1) + "\n", "utf8");
      console.log(`  denemeler.json: ${once} -> ${indeks.length} kayıt`);
    }
    if (!yaz) console.log("  (deneme modu: hiçbir dosya silinmedi)");
  } else {
    console.log("  Silmek için: node tools/deneme-onar.mjs --eski-sil --yaz");
  }
}
if (bulunamayan) console.log(`UYARI: ${bulunamayan} soruya yedek bulunamadı, oldukları gibi bırakıldı.`);
if (!yaz) console.log("\nHiçbir dosya yazılmadı. Yazmak için: node tools/deneme-onar.mjs --yaz");
