"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    await apiFetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-gold/20 bg-white">
      <div className="border-b border-gold/10 px-5 py-5">
        <Link href="/admin" className="font-display text-lg font-bold text-cocoa">
          E&amp;E <span className="text-gold">Kiddies</span>
        </Link>
        <p className="text-xs text-cocoa/50">Admin Panel</p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-gold text-white shadow"
                  : "text-cocoa/70 hover:bg-brandyellow/20"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        <Link
          href="/"
          className="block rounded-xl px-4 py-2.5 text-sm font-semibold text-cocoa/70 transition hover:bg-brandyellow/20"
        >
          View Store ↗
        </Link>
      </nav>
      <div className="border-t border-gold/10 p-3">
        <button
          type="button"
          onClick={logout}
          disabled={loggingOut}
          className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
        >
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </aside>
  );
}
