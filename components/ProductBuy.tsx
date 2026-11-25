"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cartAdd, cartHas } from "@/lib/cart-client";
import { getDict, sizeLabel, type Lang } from "@/lib/i18n";

export function ProductBuy({ lang, all, sizes }: { lang: Lang; all: string[]; sizes: { id: number; size: string; stock: number }[] }) {
  const d = getDict(lang);
  const router = useRouter();
  const [pick, setPick] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const by = new Map(sizes.map((s) => [s.size, s]));
  const add = () => {
    if (pick === null) { setMsg(d.p.pickSize); return; }
    if (cartHas(pick)) { setMsg(d.p.inCart); return; }
    cartAdd(pick);
    router.push(`/${lang}/cart`);
  };
  return (
    <>
      <div>
        <h4 style={{ margin: "0 0 8px", fontSize: 13, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--mute)", fontWeight: 600 }}>{d.p.selectSize}</h4>
        <div className="sizes">
          {all.map((s) => {
            const row = by.get(s); const ok = !!row && row.stock > 0;
            return <button key={s} type="button" className="size" disabled={!ok} aria-pressed={ok && pick === row!.id} onClick={() => { setPick(row!.id); setMsg(""); }}>{sizeLabel(s, lang)}</button>;
          })}
        </div>
      </div>
      <div className="warn" role="alert">{msg}</div>
      <button type="button" className="btn solid" onClick={add}>{d.p.add}</button>
    </>
  );
}
