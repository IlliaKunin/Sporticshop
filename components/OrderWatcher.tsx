"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { cartClear } from "@/lib/cart-client";

/** While payment confirmation is pending, re-check every 3 seconds (up to ~1 minute). Once paid, empty the cart. */
export function OrderWatcher({ status }: { status: string }) {
  const router = useRouter();
  useEffect(() => {
    if (status === "paid" || status === "shipped") { cartClear(); return; }
    if (status !== "pending") return;
    let n = 0;
    const t = setInterval(() => { if (++n > 20) clearInterval(t); else router.refresh(); }, 3000);
    return () => clearInterval(t);
  }, [status, router]);
  return null;
}
