import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateReference, type OrderItem } from "@/lib/orders";
import { initializeTransaction, paystackConfigured } from "@/lib/paystack";

const checkoutSchema = z.object({
  customerName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  address: z.string().min(5),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        size: z.string().min(1),
        qty: z.number().int().positive().max(99),
      })
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  if (!paystackConfigured()) {
    return NextResponse.json(
      { error: "payment_not_configured" },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid checkout data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { customerName, email, phone, address, items } = parsed.data;

  // Recompute prices from the database — never trust client-supplied prices.
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const orderItems: OrderItem[] = [];
  let total = 0;
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return NextResponse.json(
        { error: "A product in your cart no longer exists." },
        { status: 400 }
      );
    }
    if (product.stock < item.qty) {
      return NextResponse.json(
        { error: `"${product.name}" does not have enough stock.` },
        { status: 400 }
      );
    }
    orderItems.push({
      productId: product.id,
      name: product.name,
      size: item.size,
      qty: item.qty,
      price: product.price,
    });
    total += product.price * item.qty;
  }

  const reference = generateReference();
  const order = await prisma.order.create({
    data: {
      reference,
      customerName,
      email,
      phone,
      address,
      items: JSON.stringify(orderItems),
      total,
      status: "PENDING",
    },
  });

  const origin = req.headers.get("origin") ?? req.nextUrl.origin;

  try {
    const result = await initializeTransaction({
      email,
      amount: total,
      reference,
      callback_url: `${origin}/checkout/verify`,
      metadata: { orderId: order.id, reference },
    });
    return NextResponse.json({
      authorization_url: result.authorization_url,
      reference,
    });
  } catch (err) {
    console.error("Paystack initialize failed:", err);
    return NextResponse.json(
      { error: "Could not initialize payment. Please try again." },
      { status: 502 }
    );
  }
}
