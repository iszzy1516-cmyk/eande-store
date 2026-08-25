/**
 * E&E Kiddies — Telegram conversational product uploader.
 *
 * The shop owner chats with the bot from their phone:
 *   /add → name → category → price → sizes → stock → description → photo → confirm
 * …and the product goes live on the store immediately.
 *
 * Run with: npm run bot
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../lib/db";
import { formatNaira } from "../lib/format";
import { uniqueSlug } from "../lib/slug";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

if (!TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN is not set in .env");
  process.exit(1);
}

const API = `https://api.telegram.org/bot${TOKEN}`;
const FILE_API = `https://api.telegram.org/file/bot${TOKEN}`;
const CATEGORIES = ["CLOTHES", "SHOES", "ONESIES", "TOWELS"] as const;

type Draft = {
  step:
    | "name"
    | "category"
    | "price"
    | "sizes"
    | "stock"
    | "description"
    | "photo"
    | "confirm";
  name?: string;
  category?: string;
  priceKobo?: number;
  sizes?: string;
  stock?: number;
  description?: string;
  photoFileId?: string;
  photoExt?: string;
};

const drafts = new Map<number, Draft>();

async function tg(method: string, payload: Record<string, unknown>) {
  const res = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.ok) console.error(`Telegram ${method} failed:`, data.description);
  return data;
}

const send = (chatId: number, text: string, extra: Record<string, unknown> = {}) =>
  tg("sendMessage", { chat_id: chatId, text, ...extra });

function categoryKeyboard() {
  return {
    inline_keyboard: [
      CATEGORIES.map((c) => [
        { text: c[0] + c.slice(1).toLowerCase(), callback_data: `cat:${c}` },
      ]),
    ],
  };
}

function confirmKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "✅ Publish", callback_data: "confirm:yes" },
        { text: "❌ Cancel", callback_data: "confirm:no" },
      ],
    ],
  };
}

function draftSummary(d: Draft) {
  return [
    `Name: ${d.name}`,
    `Category: ${d.category}`,
    `Price: ${formatNaira(d.priceKobo ?? 0)}`,
    `Sizes: ${d.sizes}`,
    `Stock: ${d.stock}`,
    `Description: ${d.description}`,
  ].join("\n");
}

function parsePriceKobo(text: string): number | null {
  const naira = Number(text.replace(/[₦,\s]/g, ""));
  if (!Number.isFinite(naira) || naira <= 0) return null;
  return Math.round(naira * 100);
}

async function startAdd(chatId: number) {
  drafts.set(chatId, { step: "name" });
  await send(
    chatId,
    "Let's add a new product! 🧸\n\n1️⃣ What is the product name?\n\n(send /cancel anytime to stop)"
  );
}

async function publish(chatId: number, d: Draft) {
  const slug = await uniqueSlug(d.name!);

  // Download the photo from Telegram.
  const fileRes = await tg("getFile", { file_id: d.photoFileId! });
  const filePath = fileRes.result?.file_path as string | undefined;
  let image = "/products/placeholder.jpg";
  if (filePath) {
    const ext = path.extname(filePath) || ".jpg";
    const buf = Buffer.from(
      await (await fetch(`${FILE_API}/${filePath}`)).arrayBuffer()
    );
    const rel = `/products/${slug}${ext}`;
    await writeFile(path.join(process.cwd(), "public", rel.slice(1)), buf);
    image = rel;
  }

  const product = await prisma.product.create({
    data: {
      name: d.name!,
      slug,
      description: d.description!,
      price: d.priceKobo!,
      category: d.category!,
      sizes: d.sizes!,
      stock: d.stock!,
      image,
    },
  });

  await send(
    chatId,
    `🎉 "${product.name}" is now LIVE on the store!\n\n${draftSummary(d)}\n\nAdd another with /add`
  );
}

async function handleText(chatId: number, text: string) {
  // Gate: only the configured admin chat may manage products.
  if (ADMIN_CHAT_ID && String(chatId) !== ADMIN_CHAT_ID) {
    await send(chatId, "Sorry, this bot is private to E&E Kiddies Wears.");
    return;
  }

  if (text === "/start" || text === "/help") {
    await send(
      chatId,
      [
        "👋 Welcome to the E&E Kiddies manager bot!",
        "",
        "/add — add a new product (step by step)",
        "/cancel — cancel the current upload",
        "",
        `Your chat ID is: ${chatId}`,
        ADMIN_CHAT_ID
          ? ""
          : "⚠️ Add this to your .env as TELEGRAM_ADMIN_CHAT_ID, then restart the bot.",
      ]
        .filter(Boolean)
        .join("\n")
    );
    return;
  }

  if (!ADMIN_CHAT_ID) {
    await send(
      chatId,
      `Bot not configured yet. Your chat ID is: ${chatId}\nAdd it to .env as TELEGRAM_ADMIN_CHAT_ID and restart the bot.`
    );
    return;
  }

  if (text === "/cancel") {
    drafts.delete(chatId);
    await send(chatId, "Cancelled. No product was saved. 👍");
    return;
  }

  if (text === "/add") {
    await startAdd(chatId);
    return;
  }

  const d = drafts.get(chatId);
  if (!d) {
    await send(chatId, "Send /add to upload a new product, or /help for commands.");
    return;
  }

  switch (d.step) {
    case "name":
      if (text.length < 2) {
        await send(chatId, "Name is too short — try again.");
        return;
      }
      d.name = text;
      d.step = "category";
      await send(chatId, "2️⃣ Pick a category:", { reply_markup: categoryKeyboard() });
      break;

    case "price": {
      const kobo = parsePriceKobo(text);
      if (!kobo) {
        await send(chatId, "That doesn't look like a price. Send numbers only, e.g. 8500");
        return;
      }
      d.priceKobo = kobo;
      d.step = "sizes";
      await send(
        chatId,
        `4️⃣ Sizes? (comma-separated)\n e.g. 0-6M,6-12M,1-2Y — or type "One Size"`
      );
      break;
    }

    case "sizes":
      d.sizes = text;
      d.step = "stock";
      await send(chatId, '5️⃣ How many in stock? (send a number, e.g. 10)');
      break;

    case "stock": {
      const n = parseInt(text, 10);
      if (!Number.isInteger(n) || n < 0) {
        await send(chatId, "Send a whole number, e.g. 10");
        return;
      }
      d.stock = n;
      d.step = "description";
      await send(chatId, '6️⃣ Short description of the item? (or type "skip")');
      break;
    }

    case "description":
      d.description = text.toLowerCase() === "skip" ? d.name! : text;
      d.step = "photo";
      await send(chatId, "7️⃣ Last step — send me a PHOTO of the item 📸");
      break;

    default:
      await send(chatId, "Follow the current step — or /cancel to start over.");
  }
}

async function handlePhoto(chatId: number, message: any) {
  const d = drafts.get(chatId);
  if (!d || d.step !== "photo") {
    await send(chatId, "Nice photo! Send /add first if you want to upload a product.");
    return;
  }
  const photos = message.photo as { file_id: string }[];
  d.photoFileId = photos[photos.length - 1].file_id; // largest size
  d.step = "confirm";
  await send(
    chatId,
    `📋 Review the product:\n\n${draftSummary(d)}\n\nPublish it to the store?`,
    { reply_markup: confirmKeyboard() }
  );
}

async function handleCallback(query: any) {
  const chatId = query.message.chat.id as number;
  const data = query.data as string;
  await tg("answerCallbackQuery", { callback_query_id: query.id });

  if (ADMIN_CHAT_ID && String(chatId) !== ADMIN_CHAT_ID) return;

  const d = drafts.get(chatId);
  if (!d) return;

  if (data.startsWith("cat:") && d.step === "category") {
    d.category = data.slice(4);
    d.step = "price";
    await send(chatId, "3️⃣ Price in naira? (numbers only, e.g. 8500)");
    return;
  }

  if (data === "confirm:yes" && d.step === "confirm") {
    try {
      await publish(chatId, d);
    } catch (err) {
      console.error(err);
      await send(chatId, "❌ Something went wrong saving the product. Try /add again.");
    }
    drafts.delete(chatId);
    return;
  }

  if (data === "confirm:no") {
    drafts.delete(chatId);
    await send(chatId, "Cancelled — nothing was saved. Send /add to start again.");
  }
}

async function main() {
  // Long polling requires no webhook.
  await tg("deleteWebhook", { drop_pending_updates: false });

  const me = await tg("getMe", {});
  console.log(`Bot running as @${me.result?.username} (long polling). Ctrl+C to stop.`);

  let offset = 0;
  for (;;) {
    try {
      const res = await fetch(`${API}/getUpdates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offset, timeout: 30 }),
      });
      const data = await res.json();
      if (!data.ok) {
        console.error("getUpdates error:", data.description);
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      for (const update of data.result) {
        offset = update.update_id + 1;
        try {
          if (update.message?.text) {
            await handleText(update.message.chat.id, update.message.text.trim());
          } else if (update.message?.photo) {
            await handlePhoto(update.message.chat.id, update.message);
          } else if (update.callback_query) {
            await handleCallback(update.callback_query);
          }
        } catch (err) {
          console.error("Update handling failed:", err);
        }
      }
    } catch (err) {
      console.error("Polling error (retrying in 5s):", err);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

main();
