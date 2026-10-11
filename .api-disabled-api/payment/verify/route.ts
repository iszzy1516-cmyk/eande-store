import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { markOrderPaid } from "@/lib/orders";
import { bachsConfigured, getCheckoutSession } from "@/lib/bachs";

export async function GET(req: NextRequest) {
  const checkoutId = req.nextUrl.searchParams.get("checkout_id");
  const reference = req.nextUrl.searchParams.get("reference");

  const order = checkoutId
    ? await prisma.order.findFirst({ where: { paymentId: checkoutId } })
    : reference
      ? await prisma.order.findUnique({ where: { reference } })
      : null;

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Idempotent: already-confirmed orders return success immediately.
  if (order.status !== "PENDING") {
    // Return the minimum the success page needs — never totals or PII.
    return NextResponse.json({
      status: "success",
      order: { reference: order.reference },
    });
  }

  if (!bachsConfigured() || !order.paymentId) {
    return NextResponse.json(
      { error: "payment_not_configured" },
      { status: 503 }
    );
  }

  try {
    const session = await getCheckoutSession(order.paymentId);
    if (session.status === "completed") {
      // Cross-check the paid amount against the order when Bachs reports it.
      if (session.amount && session.currency === "NGN") {
        const paid = Number.parseFloat(session.amount);
        if (paid < order.total / 100) {
          return NextResponse.json(
            { status: "failed", error: "Paid amount is less than the order total." },
            { status: 400 }
          );
        }
      }
      await markOrderPaid(order.reference);
      return NextResponse.json({
        status: "success",
        order: { reference: order.reference },
      });
    }
    return NextResponse.json(
      { status: "failed", error: "Payment was not completed." },
      { status: 400 }
    );
  } catch (err) {
    console.error("Bachs verification failed:", err);
    return NextResponse.json(
      { status: "failed", error: "Could not verify payment." },
      { status: 502 }
    );
  }
}
