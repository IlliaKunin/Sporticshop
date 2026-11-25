import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripeClient } from "@/lib/payments";
import { env } from "@/lib/env";
import { tx } from "@/lib/db";
import { markPaid, releaseOrder, getOrderWithItems } from "@/lib/orders";
import { notifyOwner } from "@/lib/notify";
import { uuidSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/**
 * Stripe calls this when a payment finishes. Anyone can POST here, so the signature is verified first:
 * without Stripe's secret a forged "payment succeeded" message is rejected. Events are processed once only.
 */
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = env().STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) return new NextResponse("bad request", { status: 400 });

  const body = await req.text(); // the raw text is needed for the signature check
  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(body, sig, secret);
  } catch {
    return new NextResponse("invalid signature", { status: 400 });
  }

  const relevant = ["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed", "checkout.session.expired"];
  if (!relevant.includes(event.type)) return NextResponse.json({ ok: true });

  const session = event.data.object as Stripe.Checkout.Session;
  const parsed = uuidSchema.safeParse(session.client_reference_id ?? session.metadata?.order_id);
  if (!parsed.success) return NextResponse.json({ ok: true });
  const orderId = parsed.data;

  // Idempotency: Stripe may deliver the same event several times. Only the first one is processed.
  const first = await tx(async (q) => {
    const r = await q("insert into webhook_events(id) values ($1) on conflict do nothing returning id", [event.id]);
    return r.length > 0;
  });
  if (!first) return NextResponse.json({ ok: true, duplicate: true });

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      if (session.payment_status === "paid") {
        const result = await markPaid(orderId, { amountCents: session.amount_total ?? -1, currency: session.currency ?? "" });
        if (result === "paid") {
          const o = await getOrderWithItems(orderId);
          if (o) {
            const lines = o.items.map((i: any) => `• ${i.name} (${i.size})`).join("\n");
            await notifyOwner(`New paid order ${orderId.slice(0, 8)}\n${lines}\nTotal: €${(o.order.total_cents / 100).toFixed(2)}\n${o.order.name}, ${o.order.city}, ${o.order.country}`);
          }
        } else if (result === "review") {
          await notifyOwner(`ATTENTION: order ${orderId.slice(0, 8)} was paid but needs a manual check (pair sold out or amount mismatch). Refund in Stripe if needed.`);
        }
      }
    } else {
      await releaseOrder(orderId, "expired");
    }
  } catch (err) {
    // Let Stripe retry: forget the event id so the retry is processed.
    await tx(async (q) => { await q("delete from webhook_events where id = $1", [event.id]); });
    console.error("webhook processing failed", err instanceof Error ? err.message : "unknown");
    return new NextResponse("error", { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
