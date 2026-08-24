"use client";

import { useMemo, useState } from "react";
import ProductCard from "./ProductCard";

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

const CATEGORIES = [
  { label: "All", value: "ALL" },
  { label: "Clothes", value: "CLOTHES" },
  { label: "Shoes", value: "SHOES" },
  { label: "Onesies", value: "ONESIES" },
  { label: "Towels", value: "TOWELS" },
];

const VALID = CATEGORIES.map((c) => c.value);

export default function ShopClient({
  products,
  initialCategory = "ALL",
}: {
  products: Product[];
  initialCategory?: string;
}) {
  const [category, setCategory] = useState(
    VALID.includes(initialCategory) ? initialCategory : "ALL"
  );
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== "ALL" && p.category !== category) return false;
      if (q && !`${p.name} ${p.description}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [products, category, search]);

  return (
    <div>
      <div className="flex flex-col items-center gap-5">
        <div className="flex flex-wrap justify-center gap-2.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`rounded-full px-6 py-2 text-xs font-bold uppercase tracking-[0.12em] transition ${
                category === c.value
                  ? "bg-gold text-white"
                  : "bg-sand text-cocoa/60 hover:bg-brandyellow"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="input max-w-xs text-center"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-12 text-center text-cocoa/60">
          {search.trim()
            ? "No products match your search."
            : "Nothing here yet — new pieces are added regularly, check back soon."}
        </p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
