"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/** Switches EN/LT and stays on the same page. */
export function LangSwitch({ lang, label }: { lang: string; label: string }) {
  const path = usePathname() || `/${lang}`;
  const qs = useSearchParams().toString();
  const rest = path.replace(/^\/(en|lt)(?=\/|$)/, "");
  const href = (l: string) => `/${l}${rest}${qs ? `?${qs}` : ""}`;
  return (
    <div className="lang" role="group" aria-label={label}>
      {["en", "lt"].map((l) => (
        <Link key={l} href={href(l)} aria-pressed={lang === l} hrefLang={l} prefetch={false}
          style={{ padding: "6px 12px", fontWeight: 600, fontSize: 13, textDecoration: "none", background: lang === l ? "#111" : "transparent", color: lang === l ? "#fff" : "inherit" }}>
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
