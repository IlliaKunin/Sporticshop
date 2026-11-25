import { requireAdmin } from "@/lib/auth";
import { adminListOrders } from "@/lib/orders";
import { cancelOrderAction, shipOrderAction } from "../../actions";

export const dynamic = "force-dynamic";
const LABEL: Record<string, string> = { pending: "Ждёт оплаты", paid: "Оплачен", shipped: "Отправлен", cancelled: "Отменён", expired: "Истёк", needs_review: "Проверить!" };
const eur = (c: number) => `€${(c / 100).toFixed(2)}`;

export default async function Orders() {
  await requireAdmin();
  const orders = await adminListOrders();
  return (
    <>
      <h1 style={{ fontSize: 48, marginBottom: 16 }}>Заказы</h1>
      <p className="hint">«Проверить!» — клиент оплатил, но пара уже ушла или сумма не совпала. Верните деньги в Stripe или свяжитесь с клиентом.</p>
      <div className="tablewrap" style={{ marginTop: 12 }}>
        <table>
          <thead><tr><th>Заказ</th><th>Покупатель</th><th>Товары</th><th>Сумма</th><th>Статус</th><th>Действия</th></tr></thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={6} className="hint">Заказов пока нет.</td></tr>}
            {orders.map((o) => (
              <tr key={o.id}>
                <td>#{String(o.id).slice(0, 8)}<br /><span className="hint">{new Date(o.created_at).toLocaleString("ru-RU")}</span></td>
                <td>{o.name}<br /><span className="hint">{o.email}<br />{o.phone}<br />{o.address}, {o.postal} {o.city}, {o.country}</span></td>
                <td>{o.items.map((i, n) => <div key={n}>{i.name} · {i.size}</div>)}</td>
                <td>{eur(o.total_cents)}<br /><span className="hint">доставка {eur(o.shipping_cents)}</span></td>
                <td><span className={`pill ${o.status}`}>{LABEL[o.status] ?? o.status}</span>{o.tracking_number && <><br /><span className="hint">{o.tracking_number}</span></>}</td>
                <td>
                  {o.status === "paid" && (
                    <form action={shipOrderAction} className="rowflex" style={{ marginBottom: 8 }}>
                      <input type="hidden" name="id" value={o.id} />
                      <input type="text" name="tracking" placeholder="Трек-номер" required minLength={3} maxLength={60} style={{ width: 150 }} />
                      <button className="btn solid small" type="submit">Отправлено</button>
                    </form>
                  )}
                  {["paid", "pending", "needs_review"].includes(o.status) && (
                    <details><summary style={{ fontSize: 14, fontFamily: "var(--font-body)", textTransform: "none", fontWeight: 600 }}>Отменить</summary>
                      <form action={cancelOrderAction}><input type="hidden" name="id" value={o.id} />
                        <p className="hint">Пара вернётся в продажу. Деньги верните вручную в Stripe.</p>
                        <button className="btn ghost small" type="submit">Да, отменить заказ</button></form>
                    </details>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
