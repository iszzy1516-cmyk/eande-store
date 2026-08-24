"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/format";

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      const res = await fetch("/api/checkout/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          email,
          phone,
          address,
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            qty: i.qty,
          })),
        }),
      });
      const data = await res.json();

      if (res.status === 503 && data.error === "payment_not_configured") {
        setNotice(
          "Payment gateway not configured yet — contact the store to complete your order."
        );
        return;
      }
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      clearCart();
      window.location.href = data.authorization_url;
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="section-title">Checkout</h1>
        <p className="mt-4 text-cocoa/70">Your cart is empty.</p>
        <Link href="/shop" className="btn-gold mt-6">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="section-title">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <form onSubmit={handleSubmit} className="card space-y-4 p-6 lg:col-span-3">
          <h2 className="font-display text-xl font-bold text-cocoa">
            Delivery Details
          </h2>

          <div>
            <label className="mb-1 block text-sm font-semibold text-cocoa/70">
              Full Name
            </label>
            <input
              className="input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              minLength={2}
              placeholder="e.g. Adaeze Okafor"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-cocoa/70">
              Email
            </label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-cocoa/70">
              Phone
            </label>
            <input
              type="tel"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              minLength={7}
              placeholder="0801 234 5678"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-cocoa/70">
              Delivery Address
            </label>
            <textarea
              className="input min-h-24"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              minLength={5}
              placeholder="Street, city, state"
            />
          </div>

          {notice && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              {notice}
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <button type="submit" className="btn-gold w-full" disabled={loading}>
            {loading ? "Processing..." : `Pay ${formatNaira(total)} with Paystack`}
          </button>
          <p className="text-center text-xs text-cocoa/50">
            Secure payment powered by Paystack.
          </p>
        </form>

        <aside className="card h-fit p-6 lg:col-span-2">
          <h2 className="font-display text-xl font-bold text-cocoa">
            Order Summary
          </h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li
                key={`${item.productId}::${item.size}`}
                className="flex items-center gap-3 text-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt=""
                  className="h-12 w-12 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{item.name}</p>
                  <p className="text-cocoa/60">
                    {item.size} × {item.qty}
                  </p>
                </div>
                <p className="font-bold">{formatNaira(item.price * item.qty)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-gold/20 pt-4">
            <p className="font-semibold text-cocoa/70">Total</p>
            <p className="text-xl font-bold text-gold">{formatNaira(total)}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
