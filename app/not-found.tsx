import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-7xl font-bold text-gold">404</p>
      <h1 className="section-title mt-4">Page Not Found</h1>
      <p className="mt-4 text-cocoa/70">
        This page wandered off — but the shop is right where you left it.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/shop" className="btn-gold">
          Go to Shop
        </Link>
        <Link href="/" className="btn-outline">
          Back Home
        </Link>
      </div>
    </div>
  );
}
