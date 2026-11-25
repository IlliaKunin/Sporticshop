"use client";
import Link from "next/link";
import { useCartIds } from "@/lib/cart-client";

export function CartButton({ lang, label }: { lang: string; label: string }) {
  const n = useCartIds().length;
  return (
    <Link className="cartbtn" href={`/${lang}/cart`} aria-label={`${label} (${n})`}>
      <span>{label}</span><span className="n">{n}</span>
    </Link>
  );
}
