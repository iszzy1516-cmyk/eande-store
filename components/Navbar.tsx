"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { CartIcon, SearchIcon } from "./Icons";

const NAV_LINKS = [
  { href: "/shop", label: "Shop All" },
  { href: "/shop?category=CLOTHES", label: "Clothes" },
  { href: "/shop?category=SHOES", label: "Shoes" },
  { href: "/shop?category=ONESIES", label: "Onesies" },
  { href: "/shop?category=TOWELS", label: "Towels" },
];

export default function Navbar() {
  const { count } = useCart();
  const [logoError, setLogoError] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-cocoa/5 bg-cream/95 backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoError ? "/logo.svg" : "/logo.png"}
            alt="E&E Kiddies Wears logo"
            className="h-9 w-9 object-contain"
            onError={() => !logoError && setLogoError(true)}
          />
          <span className="font-display text-xl font-bold tracking-tight text-cocoa">
            eande<span className="text-gold">kiddies</span>
          </span>
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs font-bold uppercase tracking-[0.18em] text-cocoa/70 transition hover:text-gold"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/shop"
            className="text-cocoa/80 transition hover:text-gold"
            aria-label="Search"
          >
            <SearchIcon className="h-5 w-5" />
          </Link>
          <Link
            href="/cart"
            className="relative text-cocoa/80 transition hover:text-gold"
            aria-label="Cart"
          >
            <CartIcon className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex items-center gap-5 overflow-x-auto px-4 pb-3 md:hidden">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.15em] text-cocoa/70"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
