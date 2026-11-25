import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { getDict, isLang, money, sizeLabel } from "@/lib/i18n";
import { listBrands, listProducts, SHOE_SIZES, type Filters } from "@/lib/catalog";

export const dynamic = "force-dynamic";
type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const CATS = ["running", "apparel", "team", "lifestyle"];

export default async function Shop({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<SP> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const sp = await searchParams;
  const d = getDict(lang);

  // Whitelist every filter value; anything unexpected is ignored.
  const brands = await listBrands();
  const f: Filters = {};
  if (CATS.includes(one(sp.cat))) f.cat = one(sp.cat);
  if (brands.includes(one(sp.brand))) f.brand = one(sp.brand);
  if (SHOE_SIZES.includes(one(sp.size))) f.size = one(sp.size);
  const max = Number(one(sp.max)); if (Number.isFinite(max) && max >= 40 && max <= 250) f.max = max;
  const sort = one(sp.sort); f.sort = sort === "lo" || sort === "hi" ? sort : "new";
  const items = await listProducts(f);

  const href = (patch: Partial<Record<"cat" | "brand" | "size" | "max" | "sort", string>>) => {
    const cur: Record<string, string> = { cat: f.cat ?? "", brand: f.brand ?? "", size: f.size ?? "", max: f.max ? String(f.max) : "", sort: f.sort === "new" ? "" : f.sort ?? "" };
    const merged = { ...cur, ...patch };
    const qs = new URLSearchParams(Object.entries(merged).filter(([, v]) => v)).toString();
    return `/${lang}/shop${qs ? `?${qs}` : ""}`;
  };
  const Chip = ({ on, to, children }: { on: boolean; to: string; children: React.ReactNode }) => <Link className="chip" href={to} aria-pressed={on} scroll={false}>{children}</Link>;

  return (
    <main className="page">
      <div className="wrap">
        <h1>{d.shop}</h1>
        <div className="shop">
          <aside className="filters">
            <div className="fgroup"><h4>{d.f.category}</h4><div className="chips">
              <Chip on={!f.cat} to={href({ cat: "" })}>{d.f.all}</Chip>
              {CATS.map((c) => <Chip key={c} on={f.cat === c} to={href({ cat: c })}>{d.catNames[c]}</Chip>)}
            </div></div>
            <div className="fgroup"><h4>{d.f.brand}</h4><div className="chips">
              <Chip on={!f.brand} to={href({ brand: "" })}>{d.f.all}</Chip>
              {brands.map((b) => <Chip key={b} on={f.brand === b} to={href({ brand: b })}>{b}</Chip>)}
            </div></div>
            <div className="fgroup"><h4>{d.f.size}</h4><div className="chips">
              <Chip on={!f.size} to={href({ size: "" })}>{d.f.all}</Chip>
              {SHOE_SIZES.map((s) => <Chip key={s} on={f.size === s} to={href({ size: s })}>{sizeLabel(s, lang)}</Chip>)}
            </div></div>
            <div className="fgroup"><h4>{d.f.maxprice}</h4><div className="chips">
              {[0, 100, 150, 200].map((m) => <Chip key={m} on={(f.max ?? 0) === m} to={href({ max: m ? String(m) : "" })}>{m ? money(m * 100, lang) : d.f.all}</Chip>)}
            </div></div>
            <Link className="reset" href={`/${lang}/shop`}>{d.f.reset}</Link>
          </aside>
          <div>
            <div className="toolbar">
              <span className="count">{d.items(items.length)}</span>
              <span className="chips">{(["new", "lo", "hi"] as const).map((k) => <Chip key={k} on={f.sort === k} to={href({ sort: k === "new" ? "" : k })}>{d.f.sorts[k]}</Chip>)}</span>
            </div>
            {items.length === 0 ? <div className="empty">{d.none}</div> : <div className="grid">{items.map((p) => <ProductCard key={p.id} p={p} lang={lang} d={d} />)}</div>}
          </div>
        </div>
      </div>
    </main>
  );
}
