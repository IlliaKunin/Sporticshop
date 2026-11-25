"use client";
import { useEffect, useState } from "react";
import { useCartIds } from "@/lib/cart-client";

export type Line = { sizeId: number; size: string; available: boolean; slug: string; brand: string; name: string; priceCents: number; bg: string; kind: string; art: string[]; imageUrl: string | null };

/** Fresh prices and availability for what is in the cart, read from the server. */
export function useCartLines() {
  const ids = useCartIds();
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const key = ids.join(",");
  useEffect(() => {
    let live = true;
    if (!key) { setLines([]); setLoading(false); return; }
    setLoading(true);
    fetch(`/api/cart?ids=${key}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { lines: [] }))
      .then((j) => { if (live) { setLines(j.lines ?? []); setLoading(false); } })
      .catch(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [key]);
  return { ids, lines: lines.filter((l) => ids.includes(l.sizeId)), loading };
}
