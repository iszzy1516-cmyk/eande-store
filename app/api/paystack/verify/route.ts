import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { markOrderPaid } from "@/lib/orders";
import { paystackConfigured, verifyTransaction } from "@/lib/paystack";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference");
  if (!reference) {
    return NextResponse.json(
      { error: "Missing reference" },
      { status: 400 }
    );
  }

  const order = await prisma.order.findUnique({ where: { reference } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Idempotent: already-confirmed orders return success immediately.
  if (order.status !== "PENDING") {
    return NextResponse.json({
      status: "success",
      order: { reference: order.reference, total: order.total },
    });
  }

  if (!paystackConfigured()) {
    return NextResponse.json(
      { error: "payment_not_configured" },
      { status: 503 }
    );
  }

  try {
    const result = await verifyTransaction(reference);
    if (result.status === "success" && result.amount >= order.total) {
      const paid = await markOrderPaid(reference);
      return NextResponse.json({
        status: "success",
        order: { reference: paid?.reference, total: paid?.total },
      });
    }
    return NextResponse.json(
      { status: "failed", error: "Payment was not successful." },
      { status: 400 }
    );
  } catch (err) {
    console.error("Paystack verify failed:", err);
    return NextResponse.json(
      { status: "failed", error: "Could not verify payment." },
      { status: 502 }
    );
  }
}
