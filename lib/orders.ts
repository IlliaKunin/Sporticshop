import "server-only";
import { q, tx, type Q, type Row } from "./db";
import { clearCatalogCache } from "./catalog";
import { RESERVE_MINUTES, shippingCents } from "./shipping";

export class SoldOutError extends Error {
  constructor(public sizeId: number) { super("sold out"); }
}
class Rollback extends Error {}

export type NewOrder = {
  name: string; email: string; phone: string;
  country: string; city: string; address: string; postal: string;
  locale: "en" | "lt"; provider: "stripe" | "fake"; sizeIds: number[];
};
export type OrderLine = { name: string; size: string; priceCents: number };
export type CreatedOrder = { id: string; totalCents: number; subtotalCents: number; shippingCents: number; expiresAt: Date; lines: OrderLine[] };

/**
 * Reserve the pairs and create a pending order in ONE transaction.
 * The stock decrement is a single atomic "UPDATE ... WHERE stock > 0", so two buyers can never get the same pair,
 * even if they click at the same millisecond. Prices come from the database, never from the browser.
 */
export async function createPendingOrder(o: NewOrder): Promise<CreatedOrder> {
  await releaseExpired();
  const ids = [...new Set(o.sizeIds)];
  const created = await tx(async (q) => {
    const lines: (OrderLine & { sizeId: number; productId: number })[] = [];
    for (const id of ids) {
      const r = await q(
        `update product_sizes s set stock = s.stock - 1
         from products p
         where s.id = $1 and s.stock > 0 and p.id = s.product_id and p.active
         returning s.id, s.size, s.product_id, p.brand, p.name, p.price_cents`,
        [id],
      );
      if (!r[0]) throw new SoldOutError(id);
      lines.push({ sizeId: r[0].id, productId: r[0].product_id, size: r[0].size, name: `${r[0].brand} ${r[0].name}`, priceCents: r[0].price_cents });
    }
    const subtotal = lines.reduce((a, l) => a + l.priceCents, 0);
    const shipping = shippingCents(o.country, subtotal);
    const total = subtotal + shipping;
    const ins = await q(
      `insert into orders(status, email, name, phone, country, city, address, postal, subtotal_cents, shipping_cents, total_cents, locale, provider, expires_at)
       values ('pending', $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now() + ($13 || ' minutes')::interval)
       returning id, expires_at`,
      [o.email, o.name, o.phone, o.country, o.city, o.address, o.postal, subtotal, shipping, total, o.locale, o.provider, String(RESERVE_MINUTES)],
    );
    for (const l of lines) {
      await q("insert into order_items(order_id, product_id, size_id, size, name, price_cents) values ($1,$2,$3,$4,$5,$6)", [ins[0].id, l.productId, l.sizeId, l.size, l.name, l.priceCents]);
    }
    return { id: ins[0].id as string, totalCents: total, subtotalCents: subtotal, shippingCents: shipping, expiresAt: new Date(ins[0].expires_at), lines };
  });
  clearCatalogCache();
  return created;
}

export async function attachProviderRef(orderId: string, ref: string) {
  await q("update orders set provider_ref = $2 where id = $1", [orderId, ref]);
}

/** Give the pairs of a not-yet-paid (or cancelled) order back to the shelf. Safe to call twice. */
async function restock(q: Q, orderId: string) {
  const held = await q("update orders set stock_held = false where id = $1 and stock_held returning id", [orderId]);
  if (held[0]) {
    await q("update product_sizes s set stock = s.stock + 1 from order_items i where i.order_id = $1 and s.id = i.size_id", [orderId]);
  }
}

export async function releaseOrder(orderId: string, status: "expired" | "cancelled" = "expired"): Promise<boolean> {
  const done = await tx(async (q) => {
    const r = await q("update orders set status = $2 where id = $1 and status = 'pending' returning id", [orderId, status]);
    if (!r[0]) return false;
    await restock(q, orderId);
    return true;
  });
  if (done) clearCatalogCache();
  return done;
}

/** Releases reservations whose time ran out. Called on every checkout and by the cron endpoint. */
export async function releaseExpired(): Promise<string[]> {
  const rows = await q<{ id: string; provider_ref: string | null }>("select id, provider_ref from orders where status = 'pending' and expires_at < now() limit 50");
  const released: string[] = [];
  for (const r of rows) if (await releaseOrder(r.id, "expired")) released.push(r.id);
  return released;
}

export type PaidResult = "paid" | "already" | "unknown" | "review";

/** Called when the payment provider confirms the money arrived. */
export async function markPaid(orderId: string, paid?: { amountCents: number; currency: string }): Promise<PaidResult> {
  try {
    const res = await tx(async (q): Promise<PaidResult> => {
      const [o] = await q("select * from orders where id = $1 for update", [orderId]);
      if (!o) return "unknown";
      if (o.status === "paid" || o.status === "shipped") return "already";
      if (paid && (paid.amountCents !== o.total_cents || paid.currency.toLowerCase() !== o.currency)) {
        await q("update orders set status = 'needs_review' where id = $1", [orderId]);
        return "review";
      }
      if (!o.stock_held) {
        // Reservation had already been released. Try to take the pairs back; if one is gone, a human decides (refund).
        const items = await q("select size_id from order_items where order_id = $1", [orderId]);
        for (const it of items) {
          const r = await q("update product_sizes set stock = stock - 1 where id = $1 and stock > 0 returning id", [it.size_id]);
          if (!r[0]) throw new Rollback();
        }
        await q("update orders set stock_held = true where id = $1", [orderId]);
      }
      await q("update orders set status = 'paid', paid_at = now() where id = $1", [orderId]);
      return "paid";
    });
    clearCatalogCache();
    return res;
  } catch (e) {
    if (e instanceof Rollback) {
      await q("update orders set status = 'needs_review', paid_at = now() where id = $1", [orderId]);
      return "review";
    }
    throw e;
  }
}

export async function adminCancelOrder(orderId: string) {
  await tx(async (q) => {
    const r = await q("update orders set status = 'cancelled' where id = $1 and status in ('paid','needs_review','pending') returning id", [orderId]);
    if (r[0]) await restock(q, orderId);
  });
  clearCatalogCache();
}

export async function adminMarkShipped(orderId: string, tracking: string) {
  await q("update orders set status = 'shipped', shipped_at = now(), tracking_number = $2 where id = $1 and status = 'paid'", [orderId, tracking]);
}

export async function getOrderWithItems(orderId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null;
  const [o] = await q("select * from orders where id = $1", [orderId]);
  if (!o) return null;
  const items = await q("select name, size, price_cents from order_items where order_id = $1 order by id", [orderId]);
  return { order: o, items };
}

export async function adminListOrders(limit = 100) {
  const orders = await q(
    `select o.*, coalesce(json_agg(json_build_object('name', i.name, 'size', i.size, 'price', i.price_cents) order by i.id) filter (where i.id is not null), '[]'::json) as items
     from orders o left join order_items i on i.order_id = o.id
     group by o.id order by o.created_at desc limit $1`,
    [limit],
  );
  return orders.map((o): Row & { items: { name: string; size: string; price: number }[] } => ({ ...o, items: typeof o.items === "string" ? JSON.parse(o.items) : o.items }));
}
