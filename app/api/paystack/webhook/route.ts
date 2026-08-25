import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import { markOrderPaid } from "@/lib/orders";
import { paystackConfigured } from "@/lib/paystack";

export async function POST(req: NextRequest) {
  if (!paystackConfigured()) {
    return NextResponse.json(
      { error: "payment_not_configured" },
      { status: 503 }
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") ?? "";

  const computed = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest("hex");

  const valid =
    signature.length === computed.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(computed));

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody);
    if (event.event === "charge.success" && event.data?.reference) {
      // Cross-check the paid amount against the order before confirming.
      const order = await prisma.order.findUnique({
        where: { reference: event.data.reference },
      });
      if (order && event.data.amount >= order.total) {
        await markOrderPaid(event.data.reference);
      } else if (order) {
        console.error(
          `Webhook amount mismatch for ${order.reference}: paid ${event.data.amount}, expected ${order.total}`
        );
      }
    }
  } catch (err) {
    console.error("Webhook handling failed:", err);
  }

  return NextResponse.json({ received: true });
}
