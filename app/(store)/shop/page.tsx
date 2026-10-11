import type { Metadata } from "next";
import ShopClient from "@/components/ShopClient";

export const metadata: Metadata = {
  title: "Shop",
};

export default function ShopPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="section-title text-center">Shop Collection</h1>
      <p className="mt-2 text-center text-sm text-cocoa/60">
        Premium essentials for newborns and toddlers.
      </p>
      <div className="mx-auto mt-2 h-px w-16 bg-gold/40" />
      <div className="mt-10">
        <ShopClient />
      </div>
    </div>
  );
}
