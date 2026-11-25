import "server-only";
import Stripe from "stripe";
import { env } from "./env";
import type { CreatedOrder } from "./orders";

let stripe: Stripe | null = null;
export function stripeClient(): Stripe {
  if (!stripe) {
    const key = env().STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    stripe = new Stripe(key, { maxNetworkRetries: 2, timeout: 20_000 });
  }
  return stripe;
}

/**
 * Creates a hosted Stripe Checkout page. The buyer types the card on Stripe's domain, so card data never touches our server.
 * Amounts are taken from OUR order record, not from the browser. Apple Pay / Google Pay appear automatically when enabled in Stripe.
 */
export async function createStripeCheckout(order: CreatedOrder, email: string, locale: "en" | "lt"): Promise<{ url: string; ref: string }> {
  const site = env().SITE_URL;
  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = order.lines.map((l) => ({
    quantity: 1,
    price_data: { currency: "eur", unit_amount: l.priceCents, product_data: { name: `${l.name} (${l.size})` } },
  }));
  if (order.shippingCents > 0) {
    line_items.push({ quantity: 1, price_data: { currency: "eur", unit_amount: order.shippingCents, product_data: { name: locale === "lt" ? "Pristatymas" : "Shipping" } } });
  }
  const session = await stripeClient().checkout.sessions.create(
    {
      mode: "payment",
      line_items,
      customer_email: email,
      client_reference_id: order.id,
      metadata: { order_id: order.id },
      locale,
      expires_at: Math.floor(order.expiresAt.getTime() / 1000),
      success_url: `${site}/${locale}/order/${order.id}`,
      cancel_url: `${site}/${locale}/cart`,
    },
    { idempotencyKey: `order-${order.id}` },
  );
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { url: session.url, ref: session.id };
}

export async function expireStripeSession(ref: string) {
  try { await stripeClient().checkout.sessions.expire(ref); } catch { /* already expired or completed: fine */ }
}
