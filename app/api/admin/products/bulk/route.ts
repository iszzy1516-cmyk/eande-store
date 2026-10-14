import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { csrfGuard } from "@/lib/csrf";
import { uniqueSlug } from "@/lib/slug";

const rowSchema = z.object({
  name: z.string().trim().min(2).max(120),
  category: z.enum(["CLOTHES", "SHOES", "ONESIES", "TOWELS"]),
  priceNaira: z.number().positive().max(10_000_000),
  sizes: z.string().trim().min(1).max(200),
  stock: z.number().int().min(0).max(100_000),
  description: z.string().trim().min(1).max(2000),
  featured: z.boolean().optional(),
  image: z.string().trim().max(300).optional(),
});

const bulkSchema = z.object({
  products: z.array(rowSchema).min(1).max(200),
});

/** Bulk product import from a spreadsheet (CSV). */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const forbidden = csrfGuard(req);
  if (forbidden) return forbidden;

  const body = await req.json().catch(() => null);
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid import data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const results = [];
  for (const row of parsed.data.products) {
    try {
      const slug = await uniqueSlug(row.name);
      await prisma.product.create({
        data: {
          name: row.name,
          slug,
          description: row.description,
          price: Math.round(row.priceNaira * 100), // kobo
          category: row.category,
          sizes: row.sizes,
          stock: row.stock,
          featured: row.featured ?? false,
          image: row.image?.trim() || "/logo-mark.png",
        },
      });
      results.push({ name: row.name, ok: true });
    } catch (err) {
      results.push({
        name: row.name,
        ok: false,
        error: err instanceof Error ? err.message : "Failed",
      });
    }
  }

  const created = results.filter((r) => r.ok).length;
  return NextResponse.json({ created, total: results.length, results });
}
