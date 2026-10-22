// Soru bankası değiştikten sonra yayın öncesi kontrol ve güncelleme.
// Çalıştırma:  node tools/kontrol.mjs          (sadece rapor)
//              node tools/kontrol.mjs --yaz    (index.json'u günceller)
import fs from "node:fs";
import path from "node:path";

const kok = path.resolve("public/data");
const soruKlasor = path.join(kok, "sorular");
const denemeKlasor = path.join(kok, "denemeler");
const yaz = process.argv.includes("--yaz");

const oku = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

// 1. Soru bankası
const banka = {};
const idler = new Set();
let toplam = 0;
for (const ad of fs.readdirSync(soruKlasor).filter((a) => a.endsWith(".json"))) {
  const ders = ad.replace(/\.json$/, "");
  const liste = oku(path.join(soruKlasor, ad));
  banka[ders] = liste;
  toplam += liste.length;
  for (const s of liste) idler.add(String(s.id));
}
console.log(`Soru bankası: ${Object.keys(banka).length} ders, ${toplam} soru\n`);

// 2. index.json soru sayıları
const indexYolu = path.join(kok, "index.json");
if (fs.existsSync(indexYolu)) {
  const veri = oku(indexYolu);
  const degisen = [];
  for (const ders of veri.dersler || []) {
    const yeni = (banka[ders.id] || []).length;
    if (ders.soruSayisi !== yeni) {
      degisen.push(`  ${ders.id.padEnd(22)} ${ders.soruSayisi} -> ${yeni}`);
      ders.soruSayisi = yeni;
    }
  }
  if (!degisen.length) console.log("index.json: soru sayıları zaten güncel\n");
  else {
    console.log("index.json güncellenecek:");
    console.log(degisen.join("\n"));
    if (yaz) {
      const g = new Date();
      veri.guncelleme = `${g.getFullYear()}-${String(g.getMonth() + 1).padStart(2, "0")}-${String(g.getDate()).padStart(2, "0")}`;
      fs.writeFileSync(indexYolu, JSON.stringify(veri, null, 1) + "\n", "utf8");
      console.log("  -> yazıldı\n");
    } else console.log("  (yazmak için: node tools/kontrol.mjs --yaz)\n");
  }
} else console.log("index.json bulunamadı\n");

// 3. Denemelerde kopuk soru referansı
if (fs.existsSync(denemeKlasor)) {
  const kopuk = [];
  let bakilan = 0;
  for (const ad of fs.readdirSync(denemeKlasor).filter((a) => a.endsWith(".json"))) {
    const veri = oku(path.join(denemeKlasor, ad));
    const yigin = [veri];
    const gecen = new Set();
    while (yigin.length) {
      const d = yigin.pop();
      if (Array.isArray(d)) yigin.push(...d);
      else if (d && typeof d === "object") {
        for (const [k, v] of Object.entries(d)) {
          if ((k === "id" || k === "soruId" || k === "soru_id") && (typeof v === "string" || typeof v === "number"))
            gecen.add(String(v));
          else yigin.push(v);
        }
      }
    }
    bakilan++;
    const eksik = [...gecen].filter((i) => /^\d+$/.test(i) && !idler.has(i));
    if (eksik.length) kopuk.push(`  ${ad}: ${eksik.length} kopuk referans (${eksik.slice(0, 5).join(", ")}${eksik.length > 5 ? "…" : ""})`);
  }
  console.log(`Denemeler: ${bakilan} dosya tarandı`);
  if (!kopuk.length) console.log("  kopuk soru referansı yok\n");
  else {
    console.log("  KOPUK REFERANS VAR:");
    console.log(kopuk.join("\n"));
    console.log("  Bu denemeler bankadan çıkarılmış soruları gösteriyor, yeniden üretilmeli.\n");
  }
} else console.log("denemeler klasörü bulunamadı\n");

console.log("Bitti.");
