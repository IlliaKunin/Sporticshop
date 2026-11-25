export const LANGS = ["en", "lt"] as const;
export type Lang = (typeof LANGS)[number];
export const isLang = (s: string): s is Lang => (LANGS as readonly string[]).includes(s);

export function money(cents: number, lang: Lang): string {
  const v = cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
  return lang === "lt" ? `${v.replace(".", ",")} €` : `€${v}`;
}
export const sizeLabel = (s: string, lang: Lang) => (lang === "lt" ? s.replace(".", ",") : s);

const en = {
  announce: "<b>Original only</b> · New with tags · Free delivery in Lithuania over €80",
  nav: { shop: "Shop", categories: "Categories", sizes: "Size guide", faq: "FAQ", contact: "Contact" },
  cart: "Cart",
  hero: {
    kicker: "Original sneakers and sportswear", title: "Find your <mark>pair</mark>",
    sub: "New shoes and apparel from Nike, Saucony, adidas and more. One pair per size, shipped from our own stock.",
    cta1: "Shop new drops", cta2: "Browse categories", tag: "Drop of the week",
  },
  trust: [["Original only", "Every item is new and authentic"], ["Ships in 24h", "From our own stock"], ["Secure payment", "Cards, Apple Pay, Google Pay"], ["14-day returns", "Unworn, with tags"]],
  cats: "Shop by category",
  catNames: { running: "Running shoes", apparel: "Apparel", team: "Team kit", lifestyle: "Lifestyle" } as Record<string, string>,
  shop: "All products", newDrops: "New drops", seeAll: "See all",
  f: { brand: "Brand", category: "Category", size: "Size (EU)", maxprice: "Max price", all: "All", reset: "Reset filters", sort: "Sort by", apply: "Apply",
       sorts: { new: "Newest", lo: "Price: low to high", hi: "Price: high to low" } as Record<string, string> },
  items: (n: number) => `${n} ${n === 1 ? "item" : "items"}`,
  none: "Nothing matches these filters.",
  onlyLeft: (n: number) => (n === 1 ? "Only 1 left" : `Only ${n} left`),
  sizesIn: (n: number) => `${n} ${n === 1 ? "size" : "sizes"} in stock`,
  newBadge: "New drop", soldOut: "Sold out",
  p: {
    selectSize: "Select size", add: "Add to cart", pickSize: "Pick a size first.", added: "Added to cart", inCart: "Already in your cart",
    condition: "Condition", cond: "New with tags", brand: "Brand", category: "Category", delivery: "Delivery", deliv: "Ships within 24 hours",
    sizeGuide: "Size guide", oneEach: "One pair per size. Once it is sold, it is gone.", back: "Back to shop",
  },
  c: {
    title: "Your cart", empty: "Your cart is empty.", subtotal: "Subtotal", shipping: "Shipping", free: "Free", total: "Total",
    remove: "Remove", size: "Size", checkout: "Checkout", keep: "Keep shopping", unavailable: "Sold out. Remove it to continue.",
    shipNote: (left: string) => `Add ${left} more for free delivery in Lithuania.`,
  },
  co: {
    title: "Checkout", contact: "Contact", name: "Full name", email: "E-mail", phone: "Phone", delivery: "Delivery address", country: "Country", city: "City",
    address: "Street and house number", postal: "Postal code", pay: "Pay securely", paying: "Redirecting to payment…",
    note: "You pay on the payment provider's page. We never see your card number.",
    soldOut: "One of the pairs was just sold. Please check your cart.", rate: "Too many attempts. Please wait a few minutes.",
    unavailable: "Payment is temporarily unavailable. Please try again.", invalid: "Please check the form fields.",
    reserve: "Your pairs are reserved for 30 minutes while you pay.",
  },
  o: {
    thanks: "Thank you", paid: "Payment received. We will pack your order within 24 hours.", pending: "Waiting for payment confirmation…",
    shipped: "Your order has been shipped.", tracking: "Tracking number", expired: "This order expired because it was not paid in time.",
    cancelled: "This order was cancelled.", review: "Your payment is being checked. We will contact you shortly.", order: "Order", items: "Items", refresh: "Refresh status",
  },
  sg: { title: "Size guide", cols: ["EU", "US men", "US women", "UK", "Foot length, cm"], how: "How to measure your foot",
        list: ["Stand on a sheet of paper with your heel against a wall.", "Mark the tip of your longest toe.", "Measure from the wall to the mark in centimetres.", "Find your length in the table. Between two sizes, take the larger."] },
  faqTitle: "Questions",
  faq: [["Are the products original?", "Yes. Every item is original, new and comes with tags. We sell only what we hold in stock."],
        ["How fast do you ship?", "Orders are packed and sent within 24 hours on working days. You get a tracking number by e-mail."],
        ["How much is delivery?", "Free in Lithuania over €80. Below that a flat fee applies. Other EU countries have a flat fee shown at checkout."],
        ["Can I return an item?", "Yes, within 14 days if it is unworn and has its tags. Write to us and we send the return instructions."],
        ["What if my size is sold?", "Each size is one pair. Message us on Telegram and we tell you when the model returns."],
        ["How can I pay?", "By card, Apple Pay or Google Pay on the secure payment page."]],
  footer: { tag: "Original sportswear and footwear.", shop: "Shop", help: "Help", contact: "Contact", delivery: "Delivery", returns: "Returns", fine1: "© 2026 Sportikshop", fine2: "Sample products and prices." },
  lang: "Language",
};

const lt: typeof en = {
  announce: "<b>Tik originalai</b> · Nauja su etiketėmis · Nemokamas pristatymas Lietuvoje nuo €80",
  nav: { shop: "Parduotuvė", categories: "Kategorijos", sizes: "Dydžių lentelė", faq: "DUK", contact: "Kontaktai" },
  cart: "Krepšelis",
  hero: {
    kicker: "Originalūs sportbačiai ir sportinė apranga", title: "Rask savo <mark>porą</mark>",
    sub: "Nauja avalynė ir apranga: Nike, Saucony, adidas ir kiti. Viena pora kiekvienam dydžiui, siunčiame iš savo sandėlio.",
    cta1: "Naujienos", cta2: "Kategorijos", tag: "Savaitės naujiena",
  },
  trust: [["Tik originalai", "Kiekviena prekė nauja ir autentiška"], ["Išsiunčiame per 24 val.", "Iš savo sandėlio"], ["Saugus apmokėjimas", "Kortelės, Apple Pay, Google Pay"], ["14 dienų grąžinimas", "Nenešiota, su etiketėmis"]],
  cats: "Pirkite pagal kategoriją",
  catNames: { running: "Bėgimo bateliai", apparel: "Apranga", team: "Rinktinių apranga", lifestyle: "Kasdienė avalynė" },
  shop: "Visos prekės", newDrops: "Naujienos", seeAll: "Žiūrėti viską",
  f: { brand: "Prekės ženklas", category: "Kategorija", size: "Dydis (EU)", maxprice: "Maksimali kaina", all: "Visi", reset: "Išvalyti filtrus", sort: "Rūšiuoti", apply: "Taikyti",
       sorts: { new: "Naujausi", lo: "Kaina: nuo mažiausios", hi: "Kaina: nuo didžiausios" } },
  items: (n: number) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? "prekė" : n % 10 === 0 || (n % 100 >= 11 && n % 100 <= 19) ? "prekių" : "prekės"}`,
  none: "Pagal šiuos filtrus prekių nerasta.",
  onlyLeft: (n: number) => (n === 1 ? "Liko tik 1" : `Liko tik ${n}`),
  sizesIn: (n: number) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? "dydis" : n % 10 === 0 || (n % 100 >= 11 && n % 100 <= 19) ? "dydžių" : "dydžiai"} sandėlyje`,
  newBadge: "Naujiena", soldOut: "Parduota",
  p: {
    selectSize: "Pasirinkite dydį", add: "Į krepšelį", pickSize: "Pirmiausia pasirinkite dydį.", added: "Įdėta į krepšelį", inCart: "Jau jūsų krepšelyje",
    condition: "Būklė", cond: "Nauja su etiketėmis", brand: "Prekės ženklas", category: "Kategorija", delivery: "Pristatymas", deliv: "Išsiunčiame per 24 valandas",
    sizeGuide: "Dydžių lentelė", oneEach: "Kiekvieno dydžio yra viena pora. Kai parduodama, jos nebelieka.", back: "Atgal į parduotuvę",
  },
  c: {
    title: "Jūsų krepšelis", empty: "Krepšelis tuščias.", subtotal: "Tarpinė suma", shipping: "Pristatymas", free: "Nemokamai", total: "Iš viso",
    remove: "Pašalinti", size: "Dydis", checkout: "Apmokėti", keep: "Tęsti apsipirkimą", unavailable: "Parduota. Pašalinkite, kad tęstumėte.",
    shipNote: (left: string) => `Pridėkite dar ${left} ir pristatymas Lietuvoje bus nemokamas.`,
  },
  co: {
    title: "Apmokėjimas", contact: "Kontaktai", name: "Vardas ir pavardė", email: "El. paštas", phone: "Telefonas", delivery: "Pristatymo adresas", country: "Šalis", city: "Miestas",
    address: "Gatvė ir namo numeris", postal: "Pašto kodas", pay: "Mokėti saugiai", paying: "Nukreipiama į apmokėjimą…",
    note: "Mokate mokėjimo paslaugos tiekėjo puslapyje. Mes nematome jūsų kortelės numerio.",
    soldOut: "Viena iš porų ką tik parduota. Patikrinkite krepšelį.", rate: "Per daug bandymų. Palaukite kelias minutes.",
    unavailable: "Apmokėjimas laikinai nepasiekiamas. Bandykite dar kartą.", invalid: "Patikrinkite formos laukus.",
    reserve: "Poros rezervuotos 30 minučių, kol mokate.",
  },
  o: {
    thanks: "Ačiū", paid: "Apmokėjimas gautas. Užsakymą supakuosime per 24 valandas.", pending: "Laukiama apmokėjimo patvirtinimo…",
    shipped: "Jūsų užsakymas išsiųstas.", tracking: "Siuntos sekimo numeris", expired: "Šis užsakymas nebegalioja, nes laiku nebuvo apmokėtas.",
    cancelled: "Šis užsakymas atšauktas.", review: "Jūsų apmokėjimas tikrinamas. Netrukus susisieksime.", order: "Užsakymas", items: "Prekės", refresh: "Atnaujinti būseną",
  },
  sg: { title: "Dydžių lentelė", cols: ["EU", "JAV vyrai", "JAV moterys", "JK", "Pėdos ilgis, cm"], how: "Kaip išmatuoti pėdą",
        list: ["Atsistokite ant popieriaus lapo, kulnu prie sienos.", "Pažymėkite ilgiausio piršto galą.", "Išmatuokite atstumą nuo sienos iki žymės centimetrais.", "Suraskite ilgį lentelėje. Jei tarp dviejų dydžių, rinkitės didesnį."] },
  faqTitle: "Dažni klausimai",
  faq: [["Ar prekės originalios?", "Taip. Kiekviena prekė originali, nauja ir su etiketėmis. Parduodame tik tai, ką turime sandėlyje."],
        ["Kaip greitai siunčiate?", "Užsakymus supakuojame ir išsiunčiame per 24 valandas darbo dienomis. Sekimo numerį gausite el. paštu."],
        ["Kiek kainuoja pristatymas?", "Lietuvoje nemokamas nuo €80. Mažesniems užsakymams taikomas fiksuotas mokestis. Į kitas ES šalis kaina rodoma apmokėjimo metu."],
        ["Ar galiu grąžinti prekę?", "Taip, per 14 dienų, jei prekė nenešiota ir su etiketėmis. Parašykite mums, ir atsiųsime grąžinimo instrukciją."],
        ["Ką daryti, jei mano dydis parduotas?", "Kiekvieno dydžio yra viena pora. Parašykite Telegram, ir pranešime, kai modelis sugrįš."],
        ["Kaip galiu sumokėti?", "Kortele, Apple Pay arba Google Pay saugiame apmokėjimo puslapyje."]],
  footer: { tag: "Originalūs sportiniai drabužiai ir avalynė.", shop: "Parduotuvė", help: "Pagalba", contact: "Kontaktai", delivery: "Pristatymas", returns: "Grąžinimas", fine1: "© 2026 Sportikshop", fine2: "Pavyzdinės prekės ir kainos." },
  lang: "Kalba",
};

export const dict = { en, lt };
export type Dict = typeof en;
export const getDict = (lang: Lang): Dict => dict[lang];

export const SIZE_TABLE = [["38", "5.5", "7", "5", "23.5"], ["39", "6.5", "8", "6", "24.5"], ["40", "7", "8.5", "6.5", "25"], ["41", "8", "9.5", "7.5", "26"], ["42", "8.5", "10", "8", "26.5"], ["43", "9.5", "11", "9", "27.5"], ["44", "10", "11.5", "9.5", "28"], ["45", "11", "12.5", "10.5", "29"], ["46", "12", "13.5", "11.5", "29.5"]];
