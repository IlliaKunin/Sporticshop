// Delivery rules. Amounts are in euro cents. Edit here, nothing else needs to change.
export const COUNTRIES: Record<string, { en: string; lt: string }> = {
  LT: { en: "Lithuania", lt: "Lietuva" },
  LV: { en: "Latvia", lt: "Latvija" },
  EE: { en: "Estonia", lt: "Estija" },
  PL: { en: "Poland", lt: "Lenkija" },
  DE: { en: "Germany", lt: "Vokietija" },
};
export const FREE_SHIPPING_FROM_CENTS = 8000; // Lithuania only
const LT_FEE = 390;
const EU_FEE = 790;

export function shippingCents(country: string, subtotalCents: number): number {
  if (country === "LT") return subtotalCents >= FREE_SHIPPING_FROM_CENTS ? 0 : LT_FEE;
  return EU_FEE;
}
export const RESERVE_MINUTES = 31; // Stripe's minimum checkout lifetime is 30 minutes
