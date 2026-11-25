import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { adminListProducts } from "@/lib/catalog";
import { ProductImage } from "@/components/ProductArt";
import { toggleActiveAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function Products() {
  await requireAdmin();
  const items = await adminListProducts();
  return (
    <>
      <div className="rowflex" style={{ justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ fontSize: 48 }}>Товары</h1>
        <Link className="btn solid" href="/admin/products/new">+ Добавить пару</Link>
      </div>
      <div className="tablewrap">
        <table>
          <thead><tr><th></th><th>Товар</th><th>Цена</th><th>Размеры (в наличии)</th><th>Витрина</th><th></th></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={6} className="hint">Товаров нет. Нажмите «Добавить пару».</td></tr>}
            {items.map((p) => (
              <tr key={p.id}>
                <td><div className="thumb" style={{ background: p.bg }}><ProductImage imageUrl={p.imageUrl} kind={p.kind} art={p.art} alt="" /></div></td>
                <td><b>{p.brand} {p.name}</b><br /><span className="hint">{p.category}</span></td>
                <td>€{(p.priceCents / 100).toFixed(2)}</td>
                <td>{p.sizes.filter((s) => s.stock > 0).map((s) => (s.stock > 1 ? `${s.size}×${s.stock}` : s.size)).join(", ") || <span className="hint">нет</span>}</td>
                <td><form action={toggleActiveAction}><input type="hidden" name="id" value={p.id} /><button className="pill" type="submit" style={{ background: p.active ? "var(--volt)" : "#e3e3dd" }}>{p.active ? "Показан" : "Скрыт"}</button></form></td>
                <td><Link href={`/admin/products/${p.id}`} className="linkbtn">Изменить</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
