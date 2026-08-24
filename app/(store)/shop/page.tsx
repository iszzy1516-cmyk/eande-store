import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import ShopClient from "@/components/ShopClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="section-title text-center">Shop Collection</h1>
      <p className="mt-2 text-center text-sm text-cocoa/60">
        Premium essentials for newborns and toddlers.
      </p>
      <div className="mx-auto mt-2 h-px w-16 bg-gold/40" />
      <div className="mt-10">
        <ShopClient products={products} initialCategory={category ?? "ALL"} />
      </div>
    </div>
  );
}
