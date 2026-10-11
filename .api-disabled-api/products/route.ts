import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const VALID_CATEGORIES = ["CLOTHES", "SHOES", "ONESIES", "TOWELS"];

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const where =
    category && VALID_CATEGORIES.includes(category) ? { category } : {};

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ products });
}
