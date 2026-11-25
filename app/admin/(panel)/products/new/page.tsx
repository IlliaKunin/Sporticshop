import { requireAdmin } from "@/lib/auth";
import { ProductForm } from "@/components/ProductForm";

export default async function NewProduct() {
  await requireAdmin();
  return (<><h1 style={{ fontSize: 48, marginBottom: 16 }}>Новая пара</h1><ProductForm /></>);
}
