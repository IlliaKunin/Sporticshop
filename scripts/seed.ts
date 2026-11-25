// Loads SAMPLE products so the shop is not empty during development. Run:  npm run db:seed
// It refuses to touch a database that already has products unless you add --force.
import { q } from "../lib/db";
import { slugify } from "../lib/slug";

type S = Record<string, number>;
const P: { brand: string; name: string; category: string; kind: string; price: number; bg: string; art: string[]; sizes: S; desc: [string, string] }[] = [
  { brand: "Nike", name: "Alphafly 3", category: "running", kind: "shoe", price: 219, bg: "#d6f01c", art: ["#f4f4ef", "#ff5a1f", "#111111"], sizes: { "40": 1, "41": 1, "42": 1, "43": 1, "44": 1 }, desc: ["Carbon-plated marathon racer. New with tags.", "Anglies plastikės maratono batelis. Naujas su etiketėmis."] },
  { brand: "Saucony", name: "Endorphin Speed 4", category: "running", kind: "shoe", price: 149, bg: "#ff8a3d", art: ["#f7f3ea", "#111111", "#d6f01c"], sizes: { "39": 1, "41": 1, "42": 1, "42.5": 1, "43": 1, "45": 1 }, desc: ["Fast everyday trainer with a nylon plate.", "Greitas kasdienis treniruočių batelis su nailono plokštele."] },
  { brand: "Nike", name: "Vaporfly 3", category: "running", kind: "shoe", price: 189, bg: "#ff7ab8", art: ["#ffffff", "#ff3d8b", "#111111"], sizes: { "40": 1, "42": 1, "44": 1 }, desc: ["Lightweight racing shoe. New with tags.", "Lengvas startinis batelis. Naujas su etiketėmis."] },
  { brand: "Nike", name: "Aeroswift Running Shorts", category: "apparel", kind: "shorts", price: 54, bg: "#d6f01c", art: ["#d6f01c", "#7a1b5b"], sizes: { S: 1, M: 2, L: 1 }, desc: ["Race shorts with a built-in brief.", "Bėgimo šortai su vidiniais apatiniais."] },
  { brand: "Saucony", name: "Endorphin Pro 4", category: "running", kind: "shoe", price: 179, bg: "#6aa4ff", art: ["#cfe0ff", "#0b4fd6", "#111111"], sizes: { "41": 1, "42": 1, "43": 1, "44": 1, "46": 1 }, desc: ["Top-level racing shoe with a carbon plate.", "Aukščiausio lygio startinis batelis su anglies plokštele."] },
  { brand: "Nike", name: "Ukraine Team Track Jacket", category: "team", kind: "jacket", price: 120, bg: "#0b57d0", art: ["#0b57d0", "#ffd500"], sizes: { S: 1, M: 1, L: 1, XL: 1 }, desc: ["National team track jacket.", "Nacionalinės rinktinės sportinė striukė."] },
  { brand: "Nike", name: "Pegasus 41", category: "running", kind: "shoe", price: 99, bg: "#e7e7e1", art: ["#ffffff", "#d6f01c", "#111111"], sizes: { "38": 1, "39": 1, "40": 1, "41": 1, "42": 1, "43": 1, "44": 1, "45": 1 }, desc: ["Reliable daily trainer.", "Patikimas kasdienis treniruočių batelis."] },
  { brand: "Nike", name: "Aeroswift Singlet", category: "apparel", kind: "singlet", price: 49, bg: "#b7ecd9", art: ["#b7ecd9", "#111111"], sizes: { XS: 1, S: 1, M: 1 }, desc: ["Ultralight race singlet.", "Itin lengvi bėgimo marškinėliai be rankovių."] },
  { brand: "adidas", name: "Adizero Adios Pro 3", category: "running", kind: "shoe", price: 189, bg: "#ffd400", art: ["#ffffff", "#e5242b", "#111111"], sizes: { "40": 1, "41": 1, "42": 1, "43": 1 }, desc: ["Carbon-rod racing shoe.", "Startinis batelis su anglies strypais."] },
  { brand: "Nike", name: "Dunk Low", category: "lifestyle", kind: "shoe", price: 99, bg: "#a8e06a", art: ["#ffffff", "#1f8a4c", "#111111"], sizes: { "40": 1, "41": 1, "42": 1, "42.5": 1, "43": 1, "44": 1 }, desc: ["Classic low-top. New with tags.", "Klasikiniai žemi sportbačiai. Nauji su etiketėmis."] },
  { brand: "Nike", name: "Air Force 1 '07", category: "lifestyle", kind: "shoe", price: 89, bg: "#e7e7e1", art: ["#ffffff", "#ffffff", "#111111"], sizes: { "38": 1, "39": 1, "40": 1, "41": 1, "42": 1, "43": 1, "44": 1, "45": 1, "46": 1 }, desc: ["Everyday classic.", "Kasdienė klasika."] },
  { brand: "Nike", name: "Ukraine Team Running Tee", category: "team", kind: "tee", price: 45, bg: "#ffd500", art: ["#ffd500", "#0b57d0"], sizes: { S: 1, M: 1, L: 1 }, desc: ["National team running tee.", "Nacionalinės rinktinės bėgimo marškinėliai."] },
  { brand: "Nike", name: "Pro Running Tights", category: "apparel", kind: "tights", price: 42, bg: "#ffb3d4", art: ["#ff3d8b", "#111111"], sizes: { XS: 1, S: 1, M: 1, L: 1 }, desc: ["Compression running tights.", "Kompresinės bėgimo tamprės."] },
];

async function main() {
  const force = process.argv.includes("--force");
  const n = Number((await q("select count(*)::int as n from products"))[0].n);
  if (n > 0 && !force) { console.log(`Database already has ${n} products. Use --force to add the samples anyway.`); return; }
  for (const p of P) {
    const slug = slugify(`${p.brand} ${p.name}`);
    const r = await q(
      `insert into products(slug, brand, name, category, kind, price_cents, bg, art, desc_en, desc_lt)
       values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10) on conflict (slug) do nothing returning id`,
      [slug, p.brand, p.name, p.category, p.kind, p.price * 100, p.bg, JSON.stringify(p.art), p.desc[0], p.desc[1]],
    );
    if (!r[0]) continue;
    for (const [size, stock] of Object.entries(p.sizes)) await q("insert into product_sizes(product_id, size, stock) values ($1,$2,$3)", [r[0].id, size, stock]);
  }
  console.log("Sample products added.");
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
