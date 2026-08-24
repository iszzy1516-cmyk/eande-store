"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/format";

export default function CartPage() {
  const { items, updateQty, removeItem, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="section-title">Your Cart</h1>
        <p className="mt-4 text-cocoa/70">Your cart is empty.</p>
        <Link href="/shop" className="btn-gold mt-6">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="section-title">Your Cart</h1>

      <div className="mt-8 space-y-4">
        {items.map((item) => (
          <div
            key={`${item.productId}::${item.size}`}
            className="card flex flex-wrap items-center gap-4 p-4"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image}
              alt={item.name}
              className="h-20 w-20 rounded-2xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <Link
                href={`/product/${item.slug}`}
                className="font-display font-semibold text-cocoa hover:text-gold"
              >
                {item.name}
              </Link>
              <p className="text-sm text-cocoa/60">Size: {item.size}</p>
              <p className="text-sm font-bold text-gold">
                {formatNaira(item.price)}
              </p>
            </div>
            <div className="inline-flex items-center rounded-full border border-gold/30 bg-white">
              <button
                type="button"
                onClick={() =>
                  updateQty(item.productId, item.size, item.qty - 1)
                }
                className="px-3 py-1.5 font-bold text-gold"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-7 text-center text-sm font-semibold">
                {item.qty}
              </span>
              <button
                type="button"
                onClick={() =>
                  updateQty(item.productId, item.size, item.qty + 1)
                }
                className="px-3 py-1.5 font-bold text-gold"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <p className="w-24 text-right font-bold text-cocoa">
              {formatNaira(item.price * item.qty)}
            </p>
            <button
              type="button"
              onClick={() => removeItem(item.productId, item.size)}
              className="text-sm font-semibold text-red-500 hover:underline"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="card mt-8 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-sm text-cocoa/60">Order total</p>
          <p className="text-2xl font-bold text-gold">{formatNaira(total)}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/shop" className="btn-outline">
            Continue Shopping
          </Link>
          <Link href="/checkout" className="btn-gold">
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
