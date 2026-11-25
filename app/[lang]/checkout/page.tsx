import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";
import { isLang } from "@/lib/i18n";

export default async function CheckoutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return <CheckoutForm lang={lang} />;
}
