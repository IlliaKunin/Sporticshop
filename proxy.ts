import { NextResponse, type NextRequest } from "next/server";
import { cookieName, verifySession } from "./lib/session";

/**
 * Runs before every page. Three jobs:
 *  1. Security headers on every response.
 *  2. Keep strangers out of /admin (the pages and actions check again themselves: defence in depth).
 *  3. Send "/" to the right language.
 */
const isProd = process.env.NODE_ENV === "production";
// Photos may only come from our own site or from the configured photo bucket, not from any website.
const photoHost = (() => { try { return process.env.S3_PUBLIC_URL ? new URL(process.env.S3_PUBLIC_URL).origin : ""; } catch { return ""; } })();

function securityHeaders(res: NextResponse) {
  const csp = [
    "default-src 'self'",
    // Next.js needs inline bootstrap scripts. No third-party script is allowed anywhere.
    `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${photoHost ? " " + photoHost : ""}`,
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(self), usb=()");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  if (isProd) res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  return res;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    const authed = await verifySession(req.cookies.get(cookieName())?.value).catch(() => null);
    if (!authed && pathname !== "/admin/login") {
      return securityHeaders(NextResponse.redirect(new URL("/admin/login", req.url)));
    }
    const res = securityHeaders(NextResponse.next());
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  if (pathname === "/") {
    const accept = req.headers.get("accept-language") ?? "";
    const lang = /^\s*lt|,\s*lt/i.test(accept) ? "lt" : "en";
    return securityHeaders(NextResponse.redirect(new URL(`/${lang}`, req.url)));
  }

  return securityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico|woff2)$).*)"],
};
