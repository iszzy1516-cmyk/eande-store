"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/format";

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    image: string;
    sizes: string[];
    stock: number;
  };
};

export default function AddToCart({ product }: Props) {
  const [size, setSize] = useState(product.sizes[0] ?? "One Size");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const outOfStock = product.stock <= 0;

  function handleAdd() {
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image,
      size,
      qty,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  return (
    <div className="mt-6 space-y-5">
      <div>
        <p className="mb-2 text-sm font-semibold text-cocoa/70">Size</p>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                size === s
                  ? "border-gold bg-gold text-white"
                  : "border-gold/30 bg-white text-cocoa hover:border-gold"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-cocoa/70">Quantity</p>
        <div className="inline-flex items-center rounded-full border border-gold/30 bg-white">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-4 py-2 text-lg font-bold text-gold"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-8 text-center font-semibold">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
            className="px-4 py-2 text-lg font-bold text-gold"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
        {product.stock > 0 && product.stock <= 5 && (
          <span className="ml-3 text-sm text-amber-600">
            Only {product.stock} left!
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleAdd}
          disabled={outOfStock}
          className="btn-gold"
        >
          {outOfStock ? "Out of Stock" : `Add to Cart — ${formatNaira(product.price * qty)}`}
        </button>
        {added && (
          <span className="text-sm font-semibold text-green-700">
            Added to cart!{" "}
            <Link href="/cart" className="underline">
              View cart
            </Link>
          </span>
        )}
      </div>
    </div>
  );
}
