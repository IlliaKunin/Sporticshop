"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkAdminCredentials, endAdminSession, requireAdmin, startAdminSession } from "@/lib/auth";
import { clearRateLimit, clientIp, rateLimit } from "@/lib/security";
import { adminCancelOrder, adminMarkShipped } from "@/lib/orders";
import { clearCatalogCache } from "@/lib/catalog";
import { q, tx } from "@/lib/db";
import { savePhoto } from "@/lib/storage";
import { slugify } from "@/lib/slug";
import { loginSchema, productSchema, sizeLineRe, trackingSchema, uuidSchema } from "@/lib/validators";

export type FormState = { error?: string } | undefined;
const HEX = /^#[0-9a-fA-F]{6}$/;

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const ip = clientIp(await headers());
  const parsed = loginSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) return { error: "Введите email и пароль." };
  const email = parsed.data.email.toLowerCase();

  // Brute-force protection: 5 tries per 15 min for this email+IP, 30 per hour for the IP.
  if (!(await rateLimit("login-id", [ip, email], 5, 900)) || !(await rateLimit("login-ip", [ip], 30, 3600))) {
    return { error: "Слишком много попыток. Подождите 15 минут." };
  }
  const ok = await checkAdminCredentials(email, parsed.data.password);
  if (!ok) return { error: "Неверный email или пароль." }; // same message whichever part was wrong
  await clearRateLimit("login-id", [ip, email]);
  await startAdminSession(email);
  redirect("/admin/orders");
}

export async function logoutAction() {
  await endAdminSession();
  redirect("/admin/login");
}

export async function shipOrderAction(fd: FormData) {
  await requireAdmin();
  const id = uuidSchema.safeParse(fd.get("id")); const tr = trackingSchema.safeParse(fd.get("tracking"));
  if (!id.success || !tr.success) return;
  await adminMarkShipped(id.data, tr.data);
  redirect("/admin/orders");
}

export async function cancelOrderAction(fd: FormData) {
  await requireAdmin();
  const id = uuidSchema.safeParse(fd.get("id"));
  if (!id.success) return;
  await adminCancelOrder(id.data);
  redirect("/admin/orders");
}

export async function toggleActiveAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id")); if (!Number.isInteger(id) || id <= 0) return;
  await q("update products set active = not active where id = $1", [id]);
  clearCatalogCache();
  redirect("/admin/products");
}

function parseSizes(text: string): { size: string; stock: number }[] | string {
  const out = new Map<string, number>();
  for (const part of text.split(/[\s,;]+/).filter(Boolean)) {
    const m = sizeLineRe.exec(part);
    if (!m) return `Неверный размер: «${part.slice(0, 12)}». Пример: 40, 41:2, 42`;
    out.set(m[1], m[2] === undefined ? 1 : Math.min(99, Number(m[2])));
  }
  if (out.size === 0) return "Укажите хотя бы один размер.";
  if (out.size > 24) return "Слишком много размеров (максимум 24).";
  return [...out].map(([size, stock]) => ({ size, stock }));
}

export async function saveProductAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = productSchema.safeParse({
    id: fd.get("id") || undefined, brand: fd.get("brand"), name: fd.get("name"), category: fd.get("category"), kind: fd.get("kind"),
    price: fd.get("price"), bg: fd.get("bg"), descEn: fd.get("descEn") ?? "", descLt: fd.get("descLt") ?? "",
    active: fd.get("active") === "on", sizes: fd.get("sizes") ?? "",
  });
  if (!parsed.success) return { error: "Проверьте поля формы (бренд, название, цена, цвет, размеры)." };
  const p = parsed.data;
  const sizes = parseSizes(p.sizes);
  if (typeof sizes === "string") return { error: sizes };
  const art = ["a0", "a1", "a2"].map((k) => String(fd.get(k) ?? "")).map((c) => (HEX.test(c) ? c : "#111111"));

  let imageUrl: string | null | undefined; // undefined = keep, null = remove
  const file = fd.get("photo");
  if (file instanceof File && file.size > 0) {
    try { imageUrl = await savePhoto(file); } catch (e) { return { error: `Фото: ${e instanceof Error ? e.message : "ошибка загрузки"}` }; }
  } else if (fd.get("removePhoto") === "on") imageUrl = null;

  const priceCents = Math.round(p.price * 100);
  const id = await tx(async (q) => {
    let pid = p.id;
    if (pid) {
      const r = await q(
        `update products set brand=$2, name=$3, category=$4, kind=$5, price_cents=$6, bg=$7, art=$8::jsonb, desc_en=$9, desc_lt=$10, active=$11,
         image_url = case when $12::boolean then $13 else image_url end where id=$1 returning id`,
        [pid, p.brand, p.name, p.category, p.kind, priceCents, p.bg, JSON.stringify(art), p.descEn, p.descLt, p.active, imageUrl !== undefined, imageUrl ?? null],
      );
      if (!r[0]) return null;
    } else {
      const base = slugify(`${p.brand} ${p.name}`);
      let slug = base;
      for (let n = 2; (await q("select 1 from products where slug = $1", [slug])).length; n++) slug = `${base}-${n}`;
      const r = await q(
        `insert into products(slug, brand, name, category, kind, price_cents, bg, art, desc_en, desc_lt, active, image_url)
         values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12) returning id`,
        [slug, p.brand, p.name, p.category, p.kind, priceCents, p.bg, JSON.stringify(art), p.descEn, p.descLt, p.active, imageUrl ?? null],
      );
      pid = r[0].id as number;
    }
    for (const s of sizes) {
      await q("insert into product_sizes(product_id, size, stock) values ($1,$2,$3) on conflict (product_id, size) do update set stock = excluded.stock", [pid, s.size, s.stock]);
    }
    const keep = sizes.map((s) => s.size);
    // Sizes that were removed from the list: delete if never ordered, otherwise just set stock to 0.
    await q("delete from product_sizes s where s.product_id = $1 and not (s.size = any($2::text[])) and not exists (select 1 from order_items i where i.size_id = s.id)", [pid, keep]);
    await q("update product_sizes set stock = 0 where product_id = $1 and not (size = any($2::text[]))", [pid, keep]);
    return pid;
  });
  if (id === null) return { error: "Товар не найден." };
  clearCatalogCache();
  redirect("/admin/products");
}
