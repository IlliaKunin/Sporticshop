import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { safeEqual, purgeRateLimits } from "@/lib/security";
import { releaseExpired } from "@/lib/orders";

export const dynamic = "force-dynamic";

/** Call every ~10 minutes from a free cron service with the header "Authorization: Bearer <CRON_SECRET>". */
export async function GET(req: Request) {
  const secret = env().CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) return new NextResponse("unauthorized", { status: 401 });
  const released = await releaseExpired();
  await purgeRateLimits();
  return NextResponse.json({ released: released.length });
}
