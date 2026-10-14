import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const VALID_CATEGORIES = ["CLOTHES", "SHOES", "ONESIES", "TOWELS"];

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (slug) {
    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ product });
  }

  const category = req.nextUrl.searchParams.get("category");
  const where =
    category && VALID_CATEGORIES.includes(category) ? { category } : {};

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ products });
}
