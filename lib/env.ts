import "server-only";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  SITE_URL: z.string().url().default("http://localhost:3000"),
  SESSION_SECRET: z.string().default(""),
  ADMIN_EMAIL: z.string().default(""),
  ADMIN_PASSWORD_HASH: z.string().default(""),
  DATABASE_URL: z.string().default(""),
  PAYMENTS_MODE: z.enum(["stripe", "fake"]).default("fake"),
  STRIPE_SECRET_KEY: z.string().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  S3_ENDPOINT: z.string().default(""),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().default(""),
  S3_ACCESS_KEY_ID: z.string().default(""),
  S3_SECRET_ACCESS_KEY: z.string().default(""),
  S3_PUBLIC_URL: z.string().default(""),
  TELEGRAM_BOT_TOKEN: z.string().default(""),
  TELEGRAM_CHAT_ID: z.string().default(""),
  CRON_SECRET: z.string().default(""),
});

export type Env = z.infer<typeof schema>;
let cached: Env | null = null;

/** Reads and validates configuration once. Fails loudly in production if something unsafe is configured. */
export function env(): Env {
  if (cached) return cached;
  const e = schema.parse(process.env);
  if (e.NODE_ENV === "production") {
    const problems: string[] = [];
    if (e.SESSION_SECRET.length < 32) problems.push("SESSION_SECRET must be at least 32 characters");
    if (!e.ADMIN_EMAIL || !e.ADMIN_PASSWORD_HASH.startsWith("scrypt:")) problems.push("ADMIN_EMAIL / ADMIN_PASSWORD_HASH are not set (use npm run admin:hash)");
    if (e.PAYMENTS_MODE !== "stripe") problems.push("PAYMENTS_MODE must be 'stripe' in production");
    if (!e.STRIPE_SECRET_KEY || !e.STRIPE_WEBHOOK_SECRET) problems.push("STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET are required");
    if (!e.SITE_URL.startsWith("https://")) problems.push("SITE_URL must be https in production");
    if (!e.DATABASE_URL) problems.push("DATABASE_URL is required in production");
    if (e.STORAGE_DRIVER !== "s3") problems.push("STORAGE_DRIVER must be 's3' in production (the server disk is not persistent)");
    if (e.CRON_SECRET.length < 24) problems.push("CRON_SECRET must be at least 24 characters");
    if (problems.length) throw new Error("Unsafe production configuration:\n- " + problems.join("\n- "));
  }
  cached = e;
  return e;
}

export const isProd = () => process.env.NODE_ENV === "production";
