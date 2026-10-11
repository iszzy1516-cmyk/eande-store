import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { markOrderPaid } from "@/lib/orders";
import { verifyBachsSignature } from "@/lib/bachs";

export async function POST(req: NextRequest) {
  const secret = process.env.BACHS_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "payment_not_configured" },
      { status: 503 }
    );
  }

  const rawBody = await req.text();
  const timestamp = req.headers.get("x-bachs-timestamp") ?? "";
  const signature = req.headers.get("x-bachs-signature-v2") ?? "";

  if (!verifyBachsSignature(rawBody, timestamp, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody);

    // collection.succeeded is the source of truth for a completed payment.
    if (event.type === "collection.succeeded" && event.data?.checkout_id) {
      const order = await prisma.order.findFirst({
        where: { paymentId: event.data.checkout_id },
      });

      if (order && order.status === "PENDING") {
        // Cross-check the collected amount against the order total.
        const paidAmount = Number.parseFloat(event.data.amount ?? "0");
        if (event.data.currency === "NGN" && paidAmount < order.total / 100) {
          console.error(
            `Bachs webhook amount mismatch for ${order.reference}: paid ${event.data.amount}, expected ${(order.total / 100).toFixed(2)}`
          );
        } else {
          await markOrderPaid(order.reference);
        }
      }
    }
  } catch (err) {
    console.error("Webhook handling failed:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
