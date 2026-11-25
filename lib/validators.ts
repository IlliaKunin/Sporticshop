import { z } from "zod";
import { COUNTRIES } from "./shipping";

// Every value that comes from a browser passes through one of these schemas: type, length and format are enforced,
// unknown fields are dropped. Nothing unvalidated reaches the database.
const clean = (max: number, min = 1) =>
  z.string().trim().min(min).max(max).refine((s) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(s), "bad characters");

export const checkoutSchema = z.object({
  items: z.array(z.object({ sizeId: z.number().int().positive().max(2_000_000_000) })).min(1).max(10),
  customer: z.object({
    name: clean(80, 2),
    email: z.string().trim().toLowerCase().email().max(120),
    phone: clean(24, 5).regex(/^[+0-9 ()-]+$/),
  }),
  shipping: z.object({
    country: z.string().refine((c) => c in COUNTRIES),
    city: clean(80, 2),
    address: clean(120, 3),
    postal: clean(12, 3).regex(/^[A-Za-z0-9 -]+$/),
  }),
  locale: z.enum(["en", "lt"]),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const loginSchema = z.object({
  email: z.string().trim().max(120),
  password: z.string().min(1).max(200),
});

export const sizeLineRe = /^([A-Za-z0-9.]{1,6})(?::(\d{1,3}))?$/;

export const productSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  brand: clean(40),
  name: clean(80),
  category: z.enum(["running", "apparel", "team", "lifestyle"]),
  kind: z.enum(["shoe", "shorts", "singlet", "jacket", "tee", "tights"]),
  price: z.coerce.number().min(1).max(5000),
  bg: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  descEn: z.string().trim().max(1500).default(""),
  descLt: z.string().trim().max(1500).default(""),
  active: z.boolean(),
  sizes: z.string().trim().max(400),
});

export const trackingSchema = z.string().trim().min(3).max(60).regex(/^[A-Za-z0-9 ._/-]+$/);
export const uuidSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
