"use client";
import { useState } from "react";
import Link from "next/link";
import { useCartLines } from "./useCartLines";
import { getDict, money, sizeLabel, type Lang } from "@/lib/i18n";
import { COUNTRIES, shippingCents } from "@/lib/shipping";

export function CheckoutForm({ lang }: { lang: Lang }) {
  const d = getDict(lang);
  const { lines, ids, loading } = useCartLines();
  const [country, setCountry] = useState("LT");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const ok = lines.filter((l) => l.available);
  const sub = ok.reduce((a, l) => a + l.priceCents, 0);
  const ship = shippingCents(country, sub);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) ?? "");
    setBusy(true); setError("");
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: ids.map((sizeId) => ({ sizeId })),
          customer: { name: v("name"), email: v("email"), phone: v("phone") },
          shipping: { country: v("country"), city: v("city"), address: v("address"), postal: v("postal") },
          locale: lang,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && typeof j.url === "string") { window.location.href = j.url; return; }
      setError(r.status === 409 ? d.co.soldOut : r.status === 429 ? d.co.rate : r.status === 400 ? d.co.invalid : d.co.unavailable);
    } catch { setError(d.co.unavailable); }
    setBusy(false);
  }

  if (!loading && ok.length === 0) {
    return <main className="page"><div className="wrap"><h1>{d.co.title}</h1><div className="panel" style={{ maxWidth: 520 }}><p style={{ margin: 0 }}>{d.c.empty}</p><Link className="btn solid" href={`/${lang}/shop`}>{d.c.keep}</Link></div></div></main>;
  }

  return (
    <main className="page">
      <div className="wrap">
        <h1>{d.co.title}</h1>
        <form className="two" onSubmit={submit} noValidate={false}>
          <div className="panel">
            <h3 style={{ fontSize: 26 }}>{d.co.contact}</h3>
            <div className="formgrid">
              <div className="field full"><label htmlFor="name">{d.co.name}</label><input id="name" name="name" type="text" required minLength={2} maxLength={80} autoComplete="name" /></div>
              <div className="field"><label htmlFor="email">{d.co.email}</label><input id="email" name="email" type="email" required maxLength={120} autoComplete="email" /></div>
              <div className="field"><label htmlFor="phone">{d.co.phone}</label><input id="phone" name="phone" type="tel" required minLength={5} maxLength={24} pattern="[+0-9 ()\-]+" autoComplete="tel" /></div>
            </div>
            <h3 style={{ fontSize: 26, marginTop: 8 }}>{d.co.delivery}</h3>
            <div className="formgrid">
              <div className="field"><label htmlFor="country">{d.co.country}</label>
                <select id="country" name="country" className="inp" value={country} onChange={(e) => setCountry(e.target.value)}>
                  {Object.entries(COUNTRIES).map(([c, n]) => <option key={c} value={c}>{n[lang]}</option>)}
                </select></div>
              <div className="field"><label htmlFor="city">{d.co.city}</label><input id="city" name="city" type="text" required minLength={2} maxLength={80} autoComplete="address-level2" /></div>
              <div className="field"><label htmlFor="address">{d.co.address}</label><input id="address" name="address" type="text" required minLength={3} maxLength={120} autoComplete="street-address" /></div>
              <div className="field"><label htmlFor="postal">{d.co.postal}</label><input id="postal" name="postal" type="text" required minLength={3} maxLength={12} pattern="[A-Za-z0-9 \-]+" autoComplete="postal-code" /></div>
            </div>
          </div>
          <div className="panel">
            {ok.map((l) => <div className="row" key={l.sizeId}><span>{l.brand} {l.name} · {sizeLabel(l.size, lang)}</span><span>{money(l.priceCents, lang)}</span></div>)}
            <div className="row"><span>{d.c.subtotal}</span><span>{money(sub, lang)}</span></div>
            <div className="row"><span>{d.c.shipping}</span><span>{ship === 0 ? d.c.free : money(ship, lang)}</span></div>
            <div className="row tot"><span>{d.c.total}</span><span>{money(sub + ship, lang)}</span></div>
            <div className="err" role="alert">{error}</div>
            <button className="btn solid" type="submit" disabled={busy || ok.length === 0}>{busy ? d.co.paying : d.co.pay}</button>
            <span className="note">{d.co.reserve} {d.co.note}</span>
          </div>
        </form>
      </div>
    </main>
  );
}
