import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "./db";
import { formatNaira } from "./format";
import type { OrderItem } from "./orders";

const TOKEN = process.env.TELEGRAM_ALERTS_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

export const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

export function telegramConfigured(): boolean {
  return Boolean(TOKEN && CHAT_ID);
}

export async function sendTelegramMessage(
  text: string,
  chatId: string | number | undefined = CHAT_ID
): Promise<boolean> {
  if (!TOKEN || !chatId) return false;
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Upload a local image file to a Telegram chat via multipart sendPhoto. */
export async function sendTelegramPhoto(
  absolutePath: string,
  caption: string,
  chatId: string | number | undefined = CHAT_ID
): Promise<boolean> {
  if (!TOKEN || !chatId) return false;
  try {
    const buffer = await readFile(absolutePath);
    const form = new FormData();
    form.append("chat_id", String(chatId));
    form.append("caption", caption.slice(0, 1024));
    form.append(
      "photo",
      new Blob([buffer]),
      path.basename(absolutePath)
    );
    const res = await fetch(`${TELEGRAM_API}/sendPhoto`, {
      method: "POST",
      body: form,
    });
    return res.ok;
  } catch {
    return false;
  }
}

type OrderRecord = {
  reference: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  items: string;
  total: number;
};

/**
 * Send a new-order alert to the shop owner: customer details first,
 * then one photo per ordered item. Never throws.
 */
export async function sendOrderAlert(order: OrderRecord): Promise<void> {
  if (!telegramConfigured()) return;

  const items = JSON.parse(order.items) as OrderItem[];
  const lines = items.map(
    (i) => `• ${i.qty}× ${i.name} (${i.size}) — ${formatNaira(i.price * i.qty)}`
  );

  const text = [
    "🛍️ NEW ORDER — PAID ✅",
    "",
    `👤 Customer: ${order.customerName}`,
    `📞 Phone: ${order.phone}`,
    `📧 Email: ${order.email}`,
    `📍 Delivery: ${order.address}`,
    "",
    "Items:",
    ...lines,
    "",
    `💰 Total: ${formatNaira(order.total)}`,
    `🔖 Ref: ${order.reference}`,
  ].join("\n");

  await sendTelegramMessage(text);

  // Attach each item's product photo.
  const ids = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({ where: { id: { in: ids } } });
  const imageById = new Map(products.map((p) => [p.id, p.image]));

  for (const item of items) {
    const image = imageById.get(item.productId);
    if (!image || !image.startsWith("/")) continue;
    const absolutePath = path.join(process.cwd(), "public", image);
    await sendTelegramPhoto(absolutePath, `${item.qty}× ${item.name} (${item.size})`);
  }
}
