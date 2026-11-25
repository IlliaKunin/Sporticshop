// Admin session = a signed token in an httpOnly cookie. No database lookup, expires on its own.
// Kept free of Node-only imports so the proxy (edge-style) can verify it too.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_TTL_SEC = 60 * 60 * 8; // 8 hours
export const cookieName = () => (process.env.NODE_ENV === "production" ? "__Host-sk_admin" : "sk_admin");

function key() {
  const s = process.env.SESSION_SECRET ?? "";
  if (s.length < 32) throw new Error("SESSION_SECRET must be set (32+ characters)");
  return new TextEncoder().encode(s);
}

export async function signSession(email: string): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SEC}s`)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<{ email: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (payload.role !== "admin" || typeof payload.sub !== "string") return null;
    return { email: payload.sub };
  } catch {
    return null;
  }
}
