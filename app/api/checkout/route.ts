import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validators";
import { assertSameOrigin, clientIp, rateLimit } from "@/lib/security";
import { createPendingOrder, attachProviderRef, releaseOrder, SoldOutError } from "@/lib/orders";
import { createStripeCheckout } from "@/lib/payments";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: Request) {
  if (!assertSameOrigin(req)) return json({ error: "forbidden" }, 403);

  // Bound the body size before parsing (a normal order is well under 2 KB).
  const raw = await req.text();
  if (raw.length > 8_000) return json({ error: "too_large" }, 413);

  const ip = clientIp(req.headers);
  if (!(await rateLimit("checkout", [ip], 10, 600))) return json({ error: "rate_limited" }, 429);

  let data;
  try { data = checkoutSchema.safeParse(JSON.parse(raw)); } catch { return json({ error: "invalid" }, 400); }
  if (!data.success) return json({ error: "invalid" }, 400);
  const d = data.data;

  const e = env();
  const provider = e.PAYMENTS_MODE === "stripe" ? "stripe" : "fake";

  let order;
  try {
    order = await createPendingOrder({
      ...d.customer, ...d.shipping, locale: d.locale, provider, sizeIds: d.items.map((i) => i.sizeId),
    });
  } catch (err) {
    if (err instanceof SoldOutError) return json({ error: "sold_out", sizeId: err.sizeId }, 409);
    console.error("createPendingOrder failed", err instanceof Error ? err.message : "unknown");
    return json({ error: "server" }, 500);
  }

  try {
    if (provider === "stripe") {
      const { url, ref } = await createStripeCheckout(order, d.customer.email, d.locale);
      await attachProviderRef(order.id, ref);
      return json({ url });
    }
    // Development only: no real money. Production refuses to start with PAYMENTS_MODE=fake (see lib/env.ts).
    return json({ url: `/api/dev/fake-pay?order=${order.id}` });
  } catch (err) {
    console.error("payment session failed", err instanceof Error ? err.message : "unknown");
    await releaseOrder(order.id, "cancelled"); // do not keep the pairs locked if payment could not start
    return json({ error: "payment_unavailable" }, 502);
  }
}
