import "server-only";
import { q } from "./db";

export type SizeRow = { id: number; size: string; stock: number };
export type Product = {
  id: number; slug: string; brand: string; name: string;
  category: "running" | "apparel" | "team" | "lifestyle";
  kind: "shoe" | "shorts" | "singlet" | "jacket" | "tee" | "tights";
  priceCents: number; bg: string; art: string[]; imageUrl: string | null;
  descEn: string; descLt: string; active: boolean; sizes: SizeRow[];
};

export const SHOE_SIZES = ["38", "39", "40", "41", "42", "42.5", "43", "44", "45", "46"];
export const CLOTHES_SIZES = ["XS", "S", "M", "L", "XL"];
const ORDER = [...SHOE_SIZES, ...CLOTHES_SIZES];

function map(r: any): Product {
  const sizes: SizeRow[] = (typeof r.sizes === "string" ? JSON.parse(r.sizes) : r.sizes) ?? [];
  sizes.sort((a, b) => ORDER.indexOf(a.size) - ORDER.indexOf(b.size));
  return {
    id: r.id, slug: r.slug, brand: r.brand, name: r.name, category: r.category, kind: r.kind,
    priceCents: r.price_cents, bg: r.bg, art: typeof r.art === "string" ? JSON.parse(r.art) : r.art,
    imageUrl: r.image_url, descEn: r.desc_en, descLt: r.desc_lt, active: r.active, sizes,
  };
}

const SELECT = `
  select p.*, coalesce(json_agg(json_build_object('id', s.id, 'size', s.size, 'stock', s.stock) order by s.id)
         filter (where s.id is not null), '[]'::json) as sizes
  from products p left join product_sizes s on s.product_id = p.id`;

// Tiny in-memory cache so that browsing the catalogue does not hit the database every time
// (the free database sleeps when idle). Cleared whenever the admin changes something or an order is made.
// Kept on globalThis so every route in the same server process shares (and can clear) the same cache.
const gc = globalThis as unknown as { __catalogCache?: Map<string, { at: number; v: unknown }> };
const cache = (gc.__catalogCache ??= new Map());
const TTL = 20_000;
async function memo<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.v as T;
  const v = await fn();
  cache.set(key, { at: Date.now(), v });
  return v;
}
export function clearCatalogCache() { cache.clear(); }

export type Filters = { cat?: string; brand?: string; size?: string; max?: number; sort?: "new" | "lo" | "hi" };

export async function listProducts(f: Filters = {}): Promise<Product[]> {
  return memo("list:" + JSON.stringify(f), async () => {
    const where = ["p.active", "exists (select 1 from product_sizes x where x.product_id = p.id and x.stock > 0)"];
    const params: unknown[] = [];
    if (f.cat) { params.push(f.cat); where.push(`p.category = $${params.length}`); }
    if (f.brand) { params.push(f.brand); where.push(`p.brand = $${params.length}`); }
    if (f.size) { params.push(f.size); where.push(`exists (select 1 from product_sizes y where y.product_id = p.id and y.size = $${params.length} and y.stock > 0)`); }
    if (f.max && Number.isFinite(f.max)) { params.push(Math.round(f.max * 100)); where.push(`p.price_cents <= $${params.length}`); }
    // ORDER BY comes from a fixed whitelist, never from user text
    const order = f.sort === "lo" ? "p.price_cents asc, p.id desc" : f.sort === "hi" ? "p.price_cents desc, p.id desc" : "p.created_at desc, p.id desc";
    const rows = await q(`${SELECT} where ${where.join(" and ")} group by p.id order by ${order}`, params);
    return rows.map(map);
  });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return memo("slug:" + slug, async () => {
    const rows = await q(`${SELECT} where p.slug = $1 and p.active group by p.id`, [slug]);
    return rows[0] ? map(rows[0]) : null;
  });
}

export async function listBrands(): Promise<string[]> {
  return memo("brands", async () => (await q<{ brand: string }>("select distinct brand from products where active order by brand")).map((r) => r.brand));
}

/** Fresh, uncached read of specific sizes for the cart (prices and stock must be exact). */
export async function getCartLines(sizeIds: number[]) {
  if (!sizeIds.length) return [];
  const rows = await q(
    `select s.id as size_id, s.size, s.stock, p.id as product_id, p.slug, p.brand, p.name, p.price_cents, p.bg, p.kind, p.art, p.image_url
     from product_sizes s join products p on p.id = s.product_id
     where s.id = any($1::int[]) and p.active`,
    [sizeIds],
  );
  return rows.map((r) => ({
    sizeId: r.size_id as number, size: r.size as string, available: r.stock > 0,
    productId: r.product_id as number, slug: r.slug as string, brand: r.brand as string, name: r.name as string,
    priceCents: r.price_cents as number, bg: r.bg as string, kind: r.kind as Product["kind"],
    art: (typeof r.art === "string" ? JSON.parse(r.art) : r.art) as string[], imageUrl: r.image_url as string | null,
  }));
}

export async function adminListProducts(): Promise<(Product & { totalStock: number })[]> {
  const rows = await q(`${SELECT} group by p.id order by p.created_at desc, p.id desc`);
  return rows.map((r) => { const p = map(r); return { ...p, totalStock: p.sizes.reduce((a, s) => a + s.stock, 0) }; });
}
export async function adminGetProduct(id: number): Promise<Product | null> {
  const rows = await q(`${SELECT} where p.id = $1 group by p.id`, [id]);
  return rows[0] ? map(rows[0]) : null;
}
