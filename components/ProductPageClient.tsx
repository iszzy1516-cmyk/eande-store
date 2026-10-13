"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { formatNaira } from "@/lib/format";
import AddToCart from "@/components/AddToCart";
import ProductCard from "@/components/ProductCard";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  category: string;
  sizes: string;
};

export default function ProductPageClient() {
  const [slug, setSlug] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const m = window.location.pathname.match(/\/product\/([^/]+)/);
    setSlug(m ? decodeURIComponent(m[1]) : "");
  }, []);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    apiFetch(`/api/products?slug=${encodeURIComponent(slug)}`)
      .then(async (r) => {
        if (r.status === 404) {
          if (!cancelled) setNotFound(true);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then(async (d) => {
        if (cancelled || !d?.product) return;
        const p = d.product as Product;
        setProduct(p);
        const all = await apiFetch("/api/products").then((r) =>
          r.ok ? r.json() : { products: [] }
        );
        if (!cancelled) {
          setRelated(
            (all.products as Product[])
              .filter((x) => x.category === p.category && x.id !== p.id)
              .slice(0, 4)
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center text-cocoa/50">
        Loading…
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="section-title">Product Not Found</h1>
        <Link href="/shop" className="btn-gold mt-8">
          Back to Shop
        </Link>
      </div>
    );
  }

  const sizes = product.sizes
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-sm text-cocoa/60">
        <Link href="/" className="hover:text-gold">
          Home
        </Link>
        <span aria-hidden="true"> / </span>
        <Link href="/shop" className="hover:text-gold">
          Shop
        </Link>
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
