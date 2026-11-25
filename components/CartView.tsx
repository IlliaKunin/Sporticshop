"use client";
import Link from "next/link";
import { ProductImage } from "./ProductArt";
import { useCartLines } from "./useCartLines";
import { cartRemove } from "@/lib/cart-client";
import { getDict, money, sizeLabel, type Lang } from "@/lib/i18n";
import { FREE_SHIPPING_FROM_CENTS } from "@/lib/shipping";

export function CartView({ lang }: { lang: Lang }) {
  const d = getDict(lang);
  const { lines, loading } = useCartLines();
  const sub = lines.filter((l) => l.available).reduce((a, l) => a + l.priceCents, 0);
  const blocked = lines.some((l) => !l.available);
  const left = FREE_SHIPPING_FROM_CENTS - sub;
  return (
    <main className="page">
      <div className="wrap">
        <h1>{d.c.title}</h1>
        {!loading && lines.length === 0 ? (
          <div className="panel" style={{ maxWidth: 520 }}><p style={{ margin: 0 }}>{d.c.empty}</p><Link className="btn solid" href={`/${lang}/shop`}>{d.c.keep}</Link></div>
        ) : (
          <div className="two">
            <div>
              {lines.map((l) => (
                <div className="line" key={l.sizeId} style={{ gridTemplateColumns: "96px 1fr auto" }}>
                  <div className="th" style={{ background: l.bg, width: 96, height: 96, position: "relative", overflow: "hidden" }}><ProductImage imageUrl={l.imageUrl} kind={l.kind} art={l.art} alt="" /></div>
                  <div>
                    <Link href={`/${lang}/product/${l.slug}`}><b>{l.brand} {l.name}</b></Link>
                    <small>{d.c.size} {sizeLabel(l.size, lang)}</small>
                    {!l.available && <div className="err">{d.c.unavailable}</div>}
                    <br /><button className="rm" onClick={() => cartRemove(l.sizeId)}>{d.c.remove}</button>
                  </div>
                  <b>{money(l.priceCents, lang)}</b>
                </div>
              ))}
            </div>
            <div className="panel">
              <div className="row"><span>{d.c.subtotal}</span><span>{money(sub, lang)}</span></div>
              <div className="note">{left > 0 ? d.c.shipNote(money(left, lang)) : ""}</div>
              {blocked ? <button className="btn solid" disabled>{d.c.checkout}</button> : <Link className="btn solid" href={`/${lang}/checkout`} aria-disabled={lines.length === 0}>{d.c.checkout}</Link>}
              <Link className="linkbtn" href={`/${lang}/shop`}>{d.c.keep}</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
