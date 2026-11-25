import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin(); // second lock behind the proxy
  return (
    <>
      <div className="adminbar">
        <div className="wrap">
          <b style={{ fontFamily: "var(--font-display)", fontSize: 22, letterSpacing: ".04em" }}>SPORTIKSHOP</b>
          <Link href="/admin/orders">Заказы</Link>
          <Link href="/admin/products">Товары</Link>
          <form action={logoutAction}><button type="submit">Выйти</button></form>
        </div>
      </div>
      <div className="wrap" style={{ padding: "28px 20px 72px" }}>{children}</div>
    </>
  );
}
