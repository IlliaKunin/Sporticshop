import { NextResponse } from "next/server";
import { getCartLines } from "@/lib/catalog";
import { clientIp, rateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

/** Public data only (name, size, price): the cart page asks for fresh prices and availability here. */
export async function GET(req: Request) {
  if (!(await rateLimit("cart", [clientIp(req.headers)], 120, 600))) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const raw = new URL(req.url).searchParams.get("ids") ?? "";
  const ids = [...new Set(raw.split(",").map((s) => Number(s)).filter((n) => Number.isInteger(n) && n > 0 && n < 2_000_000_000))].slice(0, 10);
  const lines = await getCartLines(ids);
  return NextResponse.json({ lines }, { headers: { "Cache-Control": "no-store" } });
}
