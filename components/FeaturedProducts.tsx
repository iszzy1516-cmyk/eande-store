"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import ProductCard from "@/components/ProductCard";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  category: string;
  sizes: string;
  featured: boolean;
};

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/products")
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d) =>
        setProducts(d.products.filter((p: Product) => p.featured).slice(0, 8))
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <p className="mt-10 text-center text-sm text-cocoa/50">Loading…</p>
    );
  }
  if (products.length === 0) return null;

  return (
    <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
