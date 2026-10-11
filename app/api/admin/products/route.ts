import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { csrfGuard } from "@/lib/csrf";
import { uniqueSlug } from "@/lib/slug";

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(1),
  price: z.number().int().positive(), // kobo
  category: z.enum(["CLOTHES", "SHOES", "ONESIES", "TOWELS"]),
  sizes: z.string().min(1),
  stock: z.number().int().min(0),
  featured: z.boolean().optional().default(false),
  image: z.string().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const forbidden = csrfGuard(req);
  if (forbidden) return forbidden;

  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid product data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { image, ...data } = parsed.data;
  const slug = await uniqueSlug(data.name);

  const product = await prisma.product.create({
    data: {
      ...data,
      slug,
      image: image?.trim() || "/products/placeholder.svg",
    },
  });
  return NextResponse.json({ product }, { status: 201 });
}
