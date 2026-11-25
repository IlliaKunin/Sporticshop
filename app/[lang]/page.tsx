import Link from "next/link";
import { notFound } from "next/navigation";
import { existsSync } from "node:fs";
import path from "node:path";
import { ProductCard } from "@/components/ProductCard";
import { ProductImage } from "@/components/ProductArt";
import { getDict, isLang, SIZE_TABLE } from "@/lib/i18n";
import { listProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = getDict(lang);
  const all = await listProducts();
  const heroFile = ["hero.jpg", "hero.webp", "hero.png"].find((f) => existsSync(path.join(process.cwd(), "public", f)));
  const fresh = all.slice(0, 6);
  const catPick = (c: string) => all.find((p) => p.category === c);
  const cats: [string, string, string][] = [["running", "#d6f01c", "#111"], ["apparel", "#ffb3d4", "#111"], ["team", "#0b57d0", "#fff"], ["lifestyle", "#a8e06a", "#111"]];

  return (
    <main>
      <div className="hero">
        <div className="hero-copy">
          <div className="kicker">{d.hero.kicker}</div>
          <h1 dangerouslySetInnerHTML={{ __html: d.hero.title }} />
          <p>{d.hero.sub}</p>
          <div className="cta">
            <Link className="btn solid" href={`/${lang}/shop`}>{d.hero.cta1}</Link>
            <Link className="btn ghost" href="#categories">{d.hero.cta2}</Link>
          </div>
        </div>
        <div className="hero-art">
          {heroFile
            // eslint-disable-next-line @next/next/no-img-element
            ? <img className="hero-img" src={`/${heroFile}`} alt="Sportikshop" />
            // eslint-disable-next-line @next/next/no-img-element
            : <img className="hero-logo" src="/logo-icon.png" alt="Sportikshop" />}
        </div>
      </div>

      <div className="trust">{d.trust.map(([t, s]) => <div key={t}><b>{t}</b><span>{s}</span></div>)}</div>

      <section id="categories">
        <div className="wrap">
          <div className="sec-head"><h2>{d.cats}</h2></div>
          <div className="cats">
            {cats.map(([c, bg, fg]) => {
              const p = catPick(c);
              return (
                <Link key={c} className="cat" href={`/${lang}/shop?cat=${c}`} style={{ background: bg, color: fg }}>
                  <span className="art">{p && <ProductImage imageUrl={p.imageUrl} kind={p.kind} art={p.art} alt="" />}</span>
                  <h3>{d.catNames[c]}</h3>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section style={{ paddingTop: 8 }}>
        <div className="wrap">
          <div className="sec-head"><h2>{d.newDrops}</h2><Link className="btn ghost small" href={`/${lang}/shop`}>{d.seeAll}</Link></div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
            {fresh.map((p, i) => <ProductCard key={p.id} p={p} lang={lang} d={d} isNew={i === 0} />)}
          </div>
        </div>
      </section>

      <section className="sg" id="sizes">
        <div className="wrap">
          <div className="sec-head"><h2>{d.sg.title}</h2></div>
          <div className="sg-how">
            <div className="tablewrap">
              <table>
                <thead><tr>{d.sg.cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>{SIZE_TABLE.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{lang === "lt" ? c.replace(".", ",") : c}</td>)}</tr>)}</tbody>
              </table>
            </div>
            <div><h3 style={{ fontSize: 30, marginBottom: 12 }}>{d.sg.how}</h3><ol>{d.sg.list.map((x) => <li key={x}>{x}</li>)}</ol></div>
          </div>
        </div>
      </section>

      <section id="faq">
        <div className="wrap">
          <div className="sec-head"><h2>{d.faqTitle}</h2></div>
          <div className="faq">{d.faq.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>)}</div>
        </div>
      </section>
    </main>
  );
}
