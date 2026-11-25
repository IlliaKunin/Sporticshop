import "server-only";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env, isProd } from "./env";
import { cookieName, SESSION_TTL_SEC, signSession, verifySession } from "./session";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;
const N = 2 ** 15, R = 8, P = 1, KEYLEN = 64;

/** Format: scrypt:N:r:p:salt:hash (base64url). ":" not "$", because .env files treat "$" as a variable. Only the hash is stored, never the password. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, KEYLEN, { N, r: R, p: P, maxmem: 128 * N * R * 2 });
  return ["scrypt", N, R, P, salt.toString("base64url"), hash.toString("base64url")].join(":");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, s, h] = parts;
  try {
    const expected = Buffer.from(h, "base64url");
    const got = await scrypt(password, Buffer.from(s, "base64url"), expected.length, {
      N: Number(n), r: Number(r), p: Number(p), maxmem: 128 * Number(n) * Number(r) * 2,
    });
    return got.length === expected.length && timingSafeEqual(got, expected);
  } catch {
    return false;
  }
}

/** A fixed hash to compare against when the e-mail is wrong, so response time does not reveal which part failed. */
const DUMMY = "scrypt:32768:8:1:AAAAAAAAAAAAAAAAAAAAAA:" + "A".repeat(86);

export async function checkAdminCredentials(email: string, password: string): Promise<boolean> {
  const e = env();
  const emailOk = e.ADMIN_EMAIL.length > 0 && email.trim().toLowerCase() === e.ADMIN_EMAIL.trim().toLowerCase();
  const stored = e.ADMIN_PASSWORD_HASH.startsWith("scrypt:") ? e.ADMIN_PASSWORD_HASH : DUMMY;
  const passOk = await verifyPassword(password, emailOk ? stored : DUMMY);
  return emailOk && passOk;
}

export async function startAdminSession(email: string) {
  const token = await signSession(email.trim().toLowerCase());
  (await cookies()).set(cookieName(), token, {
    httpOnly: true,   // JavaScript on the page cannot read it
    secure: isProd(), // sent only over HTTPS in production
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SEC,
  });
}

export async function endAdminSession() {
  (await cookies()).set(cookieName(), "", { httpOnly: true, secure: isProd(), sameSite: "strict", path: "/", maxAge: 0 });
}

/** Call at the top of EVERY admin page and EVERY admin server action. The proxy check alone is not enough. */
export async function requireAdmin(): Promise<{ email: string }> {
  const s = await verifySession((await cookies()).get(cookieName())?.value);
  if (!s) redirect("/admin/login");
  return s;
}
