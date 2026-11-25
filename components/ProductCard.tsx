import Link from "next/link";
import { ProductImage } from "./ProductArt";
import { money, type Dict, type Lang } from "@/lib/i18n";
import type { Product } from "@/lib/catalog";

export function ProductCard({ p, lang, d, isNew }: { p: Product; lang: Lang; d: Dict; isNew?: boolean }) {
  const inStock = p.sizes.filter((s) => s.stock > 0).length;
  const badge = isNew ? <span className="badge hot">{d.newBadge}</span> : inStock <= 3 ? <span className="badge">{d.onlyLeft(inStock)}</span> : null;
  return (
    <Link className="card" href={`/${lang}/product/${p.slug}`}>
      <span className="tile" style={{ background: p.bg }}>{badge}<ProductImage imageUrl={p.imageUrl} kind={p.kind} art={p.art} alt={`${p.brand} ${p.name}`} /></span>
      <span className="meta">
        <span className="brandname">{p.brand}</span>
        <span className="pname">{p.name}</span>
        <span className="price">{money(p.priceCents, lang)}</span>
        <span className="cap">{d.sizesIn(inStock)}</span>
      </span>
    </Link>
  );
}
