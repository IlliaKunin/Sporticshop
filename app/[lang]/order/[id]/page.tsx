import { notFound } from "next/navigation";
import { OrderWatcher } from "@/components/OrderWatcher";
import { getDict, isLang, money, sizeLabel } from "@/lib/i18n";
import { getOrderWithItems } from "@/lib/orders";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

export default async function OrderPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang, id } = await params;
  if (!isLang(lang)) notFound();
  const data = await getOrderWithItems(id);
  if (!data) notFound();
  const { order, items } = data;
  const d = getDict(lang);
  const msg: Record<string, string> = { paid: d.o.paid, pending: d.o.pending, shipped: d.o.shipped, expired: d.o.expired, cancelled: d.o.cancelled, needs_review: d.o.review };
  // Only what the buyer needs: no address, no e-mail, no phone on this public link.
  return (
    <main className="page">
      <div className="wrap" style={{ maxWidth: 720 }}>
        <OrderWatcher status={order.status} />
        <h1>{order.status === "paid" || order.status === "shipped" ? d.o.thanks : d.o.order}</h1>
        <div className="panel">
          <div className="okmsg" style={order.status === "paid" || order.status === "shipped" ? undefined : { background: "var(--soft)" }}>{msg[order.status]}</div>
          <div className="hint">{d.o.order} #{String(order.id).slice(0, 8)}</div>
          {order.tracking_number && <div className="row"><span>{d.o.tracking}</span><b>{order.tracking_number}</b></div>}
          {items.map((i: any, n: number) => <div className="row" key={n}><span>{i.name} · {sizeLabel(i.size, lang)}</span><span>{money(i.price_cents, lang)}</span></div>)}
          <div className="row"><span>{d.c.shipping}</span><span>{order.shipping_cents === 0 ? d.c.free : money(order.shipping_cents, lang)}</span></div>
          <div className="row tot"><span>{d.c.total}</span><span>{money(order.total_cents, lang)}</span></div>
        </div>
      </div>
    </main>
  );
}
