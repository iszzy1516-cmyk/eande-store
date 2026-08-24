"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type State =
  | { status: "loading" }
  | { status: "success"; reference: string }
  | { status: "failed"; message: string };

function VerifyClient() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (!reference) {
      setState({ status: "failed", message: "No payment reference provided." });
      return;
    }
    let cancelled = false;
    fetch(`/api/paystack/verify?reference=${encodeURIComponent(reference)}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (res.status === 503 && data.error === "payment_not_configured") {
          setState({
            status: "failed",
            message:
              "Payment gateway not configured yet — contact the store to confirm your order.",
          });
        } else if (res.ok && data.status === "success") {
          setState({ status: "success", reference });
        } else {
          setState({
            status: "failed",
            message:
              data.error ||
              "We could not confirm your payment. If you were charged, please contact the store.",
          });
        }
      })
      .catch(() => {
        if (!cancelled)
          setState({
            status: "failed",
            message: "Network error while verifying payment.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      {state.status === "loading" && (
        <>
          <h1 className="section-title">Verifying Payment…</h1>
          <p className="mt-4 text-cocoa/70">
            Please wait while we confirm your payment.
          </p>
        </>
      )}

      {state.status === "success" && (
        <>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
            ✓
          </div>
          <h1 className="section-title mt-6">Thank You for Your Order!</h1>
          <p className="mt-4 text-cocoa/70">
            Your payment was successful. Your order reference is{" "}
            <span className="font-bold text-cocoa">{state.reference}</span>.
            We&apos;ll be in touch about delivery soon.
          </p>
          <Link href="/shop" className="btn-gold mt-8">
            Continue Shopping
          </Link>
        </>
      )}

      {state.status === "failed" && (
        <>
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-4xl text-red-500">
            ✕
          </div>
          <h1 className="section-title mt-6">Payment Not Confirmed</h1>
          <p className="mt-4 text-cocoa/70">{state.message}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/cart" className="btn-outline">
              Back to Cart
            </Link>
            <Link href="/shop" className="btn-gold">
              Continue Shopping
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <h1 className="section-title">Verifying Payment…</h1>
        </div>
      }
    >
      <VerifyClient />
    </Suspense>
  );
}
