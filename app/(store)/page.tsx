import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

const CATEGORIES = [
  {
    name: "Clothes",
    value: "CLOTHES",
    img: "/products/strawberry-smocked-dress.jpg",
  },
  {
    name: "Onesies",
    value: "ONESIES",
    img: "/products/bunny-bubble-romper.jpg",
  },
  {
    name: "Towels",
    value: "TOWELS",
    img: "/products/hooded-towel-gift-set.jpg",
  },
];

export default async function HomePage() {
  const featured = await prisma.product.findMany({
    where: { featured: true },
    orderBy: { createdAt: "asc" },
    take: 8,
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-[70vh] items-center justify-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/products/hero.jpg"
          alt="A calm, elegant nursery"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-white/20" />
        <div className="relative mx-4 max-w-xl bg-white/95 px-8 py-12 text-center sm:px-14">
          <h1 className="font-display text-3xl font-bold leading-snug text-gold sm:text-4xl">
            Timeless Quality for Early Years
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-cocoa/70 sm:text-base">
            Discover our collection of premium, gentle garments designed for
            newborns and toddlers. Crafted with love and minimalist elegance.
          </p>
          <Link href="/shop" className="btn-gold mt-8">
            Shop the New Collection
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="section-title text-center">Essential Categories</h2>
        <div className="mx-auto mt-2 h-px w-16 bg-gold/40" />
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-2 gap-5 sm:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.value}
              href={`/shop?category=${cat.value}`}
              className="group block"
            >
              <div className="overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="mt-3 text-center text-xs font-bold uppercase tracking-[0.18em] text-cocoa transition group-hover:text-gold">
                {cat.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="section-title text-center">Featured Pieces</h2>
        <div className="mx-auto mt-2 h-px w-16 bg-gold/40" />
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/shop" className="btn-outline">
            View All Products
          </Link>
        </div>
      </section>
    </div>
  );
}
