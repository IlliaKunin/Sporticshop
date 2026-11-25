import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { adminGetProduct } from "@/lib/catalog";
import { ProductForm } from "@/components/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) notFound();
  const p = await adminGetProduct(n);
  if (!p) notFound();
  return (<><h1 style={{ fontSize: 48, marginBottom: 16 }}>{p.brand} {p.name}</h1><ProductForm product={p} /></>);
}
