import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import "@fontsource/barlow/latin-400.css";
import "@fontsource/barlow/latin-ext-400.css";
import "@fontsource/barlow/latin-500.css";
import "@fontsource/barlow/latin-ext-500.css";
import "@fontsource/barlow/latin-600.css";
import "@fontsource/barlow/latin-ext-600.css";
import "@fontsource/barlow-condensed/latin-700.css";
import "@fontsource/barlow-condensed/latin-ext-700.css";
import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource/barlow-condensed/latin-ext-800.css";
import "../globals.css";
import { Suspense } from "react";
import { CartButton } from "@/components/CartButton";
import { LangSwitch } from "@/components/LangSwitch";
import { getDict, isLang, LANGS } from "@/lib/i18n";

export function generateStaticParams() { return LANGS.map((lang) => ({ lang })); }

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: { default: "Sportikshop", template: "%s · Sportikshop" },
    description: lang === "lt" ? "Originalūs sportiniai drabužiai ir avalynė." : "Original sportswear and footwear.",
    metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  };
}

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  const d = getDict(lang);
  return (
    <html lang={lang}>
      <body>
        <div className="announce" dangerouslySetInnerHTML={{ __html: d.announce }} />
        <header className="top">
          <div className="wrap bar">
            <Link className="brand" href={`/${lang}`} aria-label="Sportikshop">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-icon.png" alt="" height={50} width={39} style={{ height: 50, width: "auto" }} /><span>Sportikshop</span>
            </Link>
            <nav className="main">
              <Link href={`/${lang}/shop`}>{d.nav.shop}</Link>
              <Link href={`/${lang}#categories`}>{d.nav.categories}</Link>
              <Link href={`/${lang}#sizes`}>{d.nav.sizes}</Link>
              <Link href={`/${lang}#faq`}>{d.nav.faq}</Link>
              <Link href="#contact">{d.nav.contact}</Link>
            </nav>
            <div className="tools">
              <Suspense fallback={null}><LangSwitch lang={lang} label={d.lang} /></Suspense>
              <CartButton lang={lang} label={d.cart} />
            </div>
          </div>
        </header>
        {children}
        <footer id="contact">
          <div className="wrap">
            <div className="fgrid">
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-full-white.png" alt="Sportikshop" style={{ width: 200, height: "auto" }} />
                <p style={{ color: "#cfcfc8", margin: "10px 0 0", maxWidth: "30ch" }}>{d.footer.tag}</p>
              </div>
              <div><h4>{d.footer.shop}</h4>{(["running", "apparel", "team", "lifestyle"] as const).map((c) => <Link key={c} href={`/${lang}/shop?cat=${c}`}>{d.catNames[c]}</Link>)}</div>
              <div><h4>{d.footer.help}</h4><Link href={`/${lang}#sizes`}>{d.nav.sizes}</Link><Link href={`/${lang}#faq`}>{d.nav.faq}</Link></div>
              <div><h4>{d.footer.contact}</h4><a href="https://t.me/Sportikshop_naiavnist" target="_blank" rel="noopener noreferrer">Telegram</a><a href="https://www.instagram.com/sportikshop_/" target="_blank" rel="noopener noreferrer">Instagram</a></div>
            </div>
            <div className="fine"><span>{d.footer.fine1}</span><span>{d.footer.fine2}</span></div>
          </div>
        </footer>
      </body>
    </html>
  );
}
