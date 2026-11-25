import "server-only";
import { env } from "./env";

/**
 * Thin database layer. Every query is parameterised ($1, $2 ...), values never get glued into SQL text,
 * which is what rules out SQL injection. Works with a real Postgres (Neon etc.) and with PGlite,
 * an in-process Postgres used for local development.
 */
export type Row = Record<string, any>;
export type Q = <T extends Row = Row>(text: string, params?: unknown[]) => Promise<T[]>;
type Db = { q: Q; tx: <T>(fn: (q: Q) => Promise<T>) => Promise<T> };

const SCHEMA = `
create table if not exists products(
  id serial primary key,
  slug text unique not null,
  brand text not null,
  name text not null,
  category text not null check (category in ('running','apparel','team','lifestyle')),
  kind text not null default 'shoe' check (kind in ('shoe','shorts','singlet','jacket','tee','tights')),
  price_cents integer not null check (price_cents > 0),
  bg text not null default '#e7e7e1',
  art jsonb not null default '[]',
  image_url text,
  desc_en text not null default '',
  desc_lt text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists product_sizes(
  id serial primary key,
  product_id integer not null references products(id) on delete cascade,
  size text not null,
  stock integer not null default 1 check (stock >= 0),
  unique (product_id, size)
);
create table if not exists orders(
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('pending','paid','shipped','cancelled','expired','needs_review')),
  email text not null,
  name text not null,
  phone text not null,
  country text not null,
  city text not null,
  address text not null,
  postal text not null,
  subtotal_cents integer not null,
  shipping_cents integer not null,
  total_cents integer not null,
  currency text not null default 'eur',
  locale text not null default 'en',
  provider text not null,
  provider_ref text unique,
  tracking_number text,
  stock_held boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  paid_at timestamptz,
  shipped_at timestamptz
);
create table if not exists order_items(
  id serial primary key,
  order_id uuid not null references orders(id) on delete cascade,
  product_id integer not null references products(id),
  size_id integer not null references product_sizes(id),
  size text not null,
  name text not null,
  price_cents integer not null
);
create table if not exists webhook_events(id text primary key, received_at timestamptz not null default now());
create table if not exists rate_limits(key text primary key, count integer not null, reset_at timestamptz not null);
create index if not exists orders_status_idx on orders(status, expires_at);
create index if not exists order_items_order_idx on order_items(order_id);
`;

const g = globalThis as unknown as { __db?: Promise<Db> };

async function create(): Promise<Db> {
  const url = env().DATABASE_URL;
  let db: Db;
  if (url) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 15_000 });
    const q: Q = async (text, params) => (await pool.query(text, params as any[])).rows as any;
    db = {
      q,
      tx: async (fn) => {
        const c = await pool.connect();
        try {
          await c.query("begin");
          const r = await fn(async (text, params) => (await c.query(text, params as any[])).rows as any);
          await c.query("commit");
          return r;
        } catch (e) {
          await c.query("rollback").catch(() => {});
          throw e;
        } finally {
          c.release();
        }
      },
    };
  } else {
    if (env().NODE_ENV === "production") throw new Error("DATABASE_URL is required in production");
    const { PGlite } = await import("@electric-sql/pglite");
    const dir = process.env.PGLITE_DIR ?? ".data/pglite";
    (await import("node:fs")).mkdirSync(dir, { recursive: true });
    const pg = new PGlite(dir);
    await pg.waitReady;
    const q: Q = async (text, params) => (await pg.query(text, params as any[])).rows as any;
    db = {
      q,
      tx: (fn) => pg.transaction((t) => fn(async (text, params) => (await t.query(text, params as any[])).rows as any)),
    };
  }
  await db.q("select 1"); // fail early if the connection is bad
  // Create tables on first start. Safe to repeat ("if not exists").
  for (const stmt of SCHEMA.split(";\n").map((s) => s.trim()).filter(Boolean)) await db.q(stmt);
  return db;
}

export function db(): Promise<Db> {
  if (!g.__db) {
    g.__db = create().catch((e) => {
      g.__db = undefined; // allow a retry on the next request (e.g. database was waking up)
      throw e;
    });
  }
  return g.__db;
}

export async function q<T extends Row = Row>(text: string, params?: unknown[]): Promise<T[]> {
  return (await db()).q<T>(text, params);
}
export async function tx<T>(fn: (q: Q) => Promise<T>): Promise<T> {
  return (await db()).tx(fn);
}
