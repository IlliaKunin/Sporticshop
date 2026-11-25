import { notFound } from "next/navigation";
import { CartView } from "@/components/CartView";
import { isLang } from "@/lib/i18n";

export default async function CartPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <CartView lang={lang} />;
}
