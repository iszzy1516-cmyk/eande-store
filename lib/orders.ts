import { prisma } from "./db";
import { sendOrderAlert } from "./telegram";

export type OrderItem = {
  productId: string;
  name: string;
  size: string;
  qty: number;
  price: number; // kobo, unit price
};

export function generateReference(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `EE-${Date.now()}-${rand}`;
}

/**
 * Mark an order as PAID and decrement stock for its items.
 * The PENDING → PAID transition is atomic: if two callers race (e.g. the
 * verify page and the webhook), exactly one wins, and only that one
 * decrements stock and sends the Telegram alert.
 */
export async function markOrderPaid(reference: string) {
  const order = await prisma.order.findUnique({ where: { reference } });
  if (!order) return null;

  const items = JSON.parse(order.items) as OrderItem[];

  const updated = await prisma.$transaction(async (tx) => {
    // Atomically claim the transition — count is 0 if someone else did it.
    const { count } = await tx.order.updateMany({
      where: { id: order.id, status: "PENDING" },
      data: { status: "PAID" },
    });
    if (count === 0) return null;

    for (const item of items) {
      await tx.product.updateMany({
        where: { id: item.productId },
        data: { stock: { decrement: item.qty } },
      });
    }
    return tx.order.findUnique({ where: { id: order.id } });
  });

  if (!updated) return order; // already paid by a concurrent caller

  // Notify the shop owner on Telegram — fire-and-forget, never blocks payment.
  sendOrderAlert(updated).catch((err) =>
    console.error("Telegram order alert failed:", err)
  );

  return updated;
}
