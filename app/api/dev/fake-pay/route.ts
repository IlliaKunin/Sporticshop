import { NextResponse } from "next/server";
import { markPaid, getOrderWithItems } from "@/lib/orders";
import { uuidSchema } from "@/lib/validators";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/** DEVELOPMENT ONLY. Pretends the payment succeeded so the whole flow can be tested without money. */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production" || env().PAYMENTS_MODE !== "fake") return new NextResponse("not found", { status: 404 });
  const id = uuidSchema.safeParse(new URL(req.url).searchParams.get("order"));
  if (!id.success) return new NextResponse("bad request", { status: 400 });
  const o = await getOrderWithItems(id.data);
  if (!o || o.order.provider !== "fake") return new NextResponse("not found", { status: 404 });
  await markPaid(id.data);
  return NextResponse.redirect(new URL(`/${o.order.locale}/order/${id.data}`, req.url));
}
