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
 * Idempotent: an order that is not PENDING is returned unchanged.
 */
export async function markOrderPaid(reference: string) {
  const order = await prisma.order.findUnique({ where: { reference } });
  if (!order) return null;
  if (order.status !== "PENDING") return order;

  const items = JSON.parse(order.items) as OrderItem[];

  const updated = await prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID" },
    });
    for (const item of items) {
      await tx.product.updateMany({
        where: { id: item.productId },
        data: { stock: { decrement: item.qty } },
      });
    }
    return updatedOrder;
  });

  // Notify the shop owner on Telegram — fire-and-forget, never blocks payment.
  sendOrderAlert(updated).catch((err) =>
    console.error("Telegram order alert failed:", err)
  );

  return updated;
}
