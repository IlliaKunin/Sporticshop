import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { q } from "./db";
import { env } from "./env";

/** Client IP. Behind a trusted proxy (Vercel, Cloudflare, Netlify) the first X-Forwarded-For entry is the visitor. */
export function clientIp(h: Headers): string {
  const xf = h.get("x-forwarded-for");
  const ip = (xf ? xf.split(",")[0] : h.get("x-real-ip") ?? "unknown").trim();
  return ip.slice(0, 64);
}

/** Hash so that raw IPs / emails are not stored in the rate-limit table. */
function bucket(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32);
}

/**
 * Fixed-window rate limiter stored in the database, so it also works on serverless hosting
 * where every request may run in a different process. Returns true if the request is allowed.
 */
export async function rateLimit(name: string, parts: string[], limit: number, windowSec: number): Promise<boolean> {
  const key = `${name}:${bucket(parts)}`;
  const rows = await q<{ count: number }>(
    `insert into rate_limits(key, count, reset_at) values ($1, 1, now() + ($2 || ' seconds')::interval)
     on conflict (key) do update set
       count = case when rate_limits.reset_at < now() then 1 else rate_limits.count + 1 end,
       reset_at = case when rate_limits.reset_at < now() then now() + ($2 || ' seconds')::interval else rate_limits.reset_at end
     returning count`,
    [key, String(windowSec)],
  );
  return rows[0].count <= limit;
}

export async function clearRateLimit(name: string, parts: string[]) {
  await q("delete from rate_limits where key = $1", [`${name}:${bucket(parts)}`]);
}

/** Housekeeping, called from the cron endpoint. */
export async function purgeRateLimits() {
  await q("delete from rate_limits where reset_at < now() - interval '1 day'");
  await q("delete from webhook_events where received_at < now() - interval '60 days'");
}

/**
 * CSRF defence for JSON endpoints: a state-changing request must come from our own site.
 * (Server Actions already get an equivalent check from Next.js.)
 */
export function assertSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const o = new URL(origin);
    const site = new URL(env().SITE_URL);
    const host = req.headers.get("host");
    return o.host === site.host || (host !== null && o.host === host && env().NODE_ENV !== "production");
  } catch {
    return false;
  }
}

export function safeEqual(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
