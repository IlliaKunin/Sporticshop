import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProductBuy } from "@/components/ProductBuy";
import { ProductImage } from "@/components/ProductArt";
import { getDict, isLang, money } from "@/lib/i18n";
import { CLOTHES_SIZES, getProductBySlug, SHOE_SIZES } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = /^[a-z0-9-]{1,80}$/.test(slug) ? await getProductBySlug(slug) : null;
  return { title: p ? `${p.brand} ${p.name}` : "Sportikshop" };
}

export default async function ProductPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  if (!isLang(lang) || !/^[a-z0-9-]{1,80}$/.test(slug)) notFound();
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const d = getDict(lang);
  const inStock = p.sizes.filter((s) => s.stock > 0).length;
  const all = p.kind === "shoe" ? SHOE_SIZES : CLOTHES_SIZES;
  const desc = lang === "lt" ? p.descLt : p.descEn;
  return (
    <main className="page">
      <div className="wrap">
        <Link className="linkbtn" href={`/${lang}/shop`}>← {d.p.back}</Link>
        <div className="sheet" style={{ marginTop: 16, maxWidth: "none", boxShadow: "none", border: "1px solid var(--line)" }}>
          <div className="big" style={{ background: p.bg, position: "relative" }}><ProductImage imageUrl={p.imageUrl} kind={p.kind} art={p.art} alt={`${p.brand} ${p.name}`} /></div>
          <div className="info">
            <div className="brandname" style={{ fontSize: 13, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--mute)", fontWeight: 600 }}>{p.brand}</div>
            <h1 style={{ fontSize: 48, margin: 0 }}>{p.name}</h1>
            <div className="price">{money(p.priceCents, lang)}</div>
            {desc && <p style={{ margin: 0, color: "#333" }}>{desc}</p>}
            {inStock === 0 ? <div className="okmsg" style={{ background: "var(--soft)" }}>{d.soldOut}</div> : <ProductBuy lang={lang} all={all} sizes={p.sizes} />}
            <span className="note">{d.p.oneEach}</span>
            {p.kind === "shoe" && <Link className="linkbtn" href={`/${lang}#sizes`}>{d.p.sizeGuide}</Link>}
            <div className="specs">
              <div><span>{d.p.condition}</span><span>{d.p.cond}</span></div>
              <div><span>{d.p.brand}</span><span>{p.brand}</span></div>
              <div><span>{d.p.category}</span><span>{d.catNames[p.category]}</span></div>
              <div><span>{d.p.delivery}</span><span>{d.p.deliv}</span></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
