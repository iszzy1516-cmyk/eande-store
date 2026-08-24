import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { uniqueSlug } from "@/lib/slug";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(1).optional(),
  price: z.number().int().positive().optional(), // kobo
  category: z.enum(["CLOTHES", "SHOES", "ONESIES", "TOWELS"]).optional(),
  sizes: z.string().min(1).optional(),
  stock: z.number().int().min(0).optional(),
  featured: z.boolean().optional(),
  image: z.string().optional(),
});

type Props = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Props) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid product data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { image, ...data } = parsed.data;

  // Regenerate the slug when the name changes.
  let slug: string | undefined;
  if (data.name && data.name !== existing.name) {
    slug = await uniqueSlug(data.name, id);
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      ...(slug ? { slug } : {}),
      ...(image !== undefined
        ? { image: image.trim() || "/products/placeholder.svg" }
        : {}),
    },
  });
  return NextResponse.json({ product });
}

export async function DELETE(_req: NextRequest, { params }: Props) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
