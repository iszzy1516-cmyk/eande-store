import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatNaira } from "@/lib/format";
import AddToCart from "@/components/AddToCart";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  return { title: product?.name ?? "Product" };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) notFound();

  const related = await prisma.product.findMany({
    where: { category: product.category, NOT: { id: product.id } },
    take: 4,
  });

  const sizes = product.sizes
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-sm text-cocoa/60">
        <Link href="/" className="hover:text-gold">
          Home
        </Link>{" "}
        <span aria-hidden="true"> / </span>
        <Link href="/shop" className="hover:text-gold">
          Shop
        </Link>{" "}
        <span aria-hidden="true"> / </span>
        <span className="text-cocoa">{product.name}</span>
      </nav>

      <div className="mt-8 grid gap-12 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl bg-sand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.name}
            className="aspect-[4/5] w-full object-cover"
          />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
            {product.category.toLowerCase()}
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold text-cocoa sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-4 font-display text-2xl font-bold text-gold">
            {formatNaira(product.price)}
          </p>
          <p className="mt-4 leading-relaxed text-cocoa/70">
            {product.description}
          </p>

          <AddToCart
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              image: product.image,
              sizes,
              stock: product.stock,
            }}
          />
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="section-title text-center">You May Also Like</h2>
          <div className="mx-auto mt-2 h-px w-16 bg-gold/40" />
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
