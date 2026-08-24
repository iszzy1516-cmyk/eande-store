import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-cocoa/5 bg-sand">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-3">
        <div>
          <h3 className="font-display text-xl font-semibold text-cocoa">
            eande<span className="text-gold">kiddies</span>
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-cocoa/60">
            Premium, gentle garments for babies and children — clothes, shoes,
            onesies and towels, crafted with love.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
            Contact
          </h4>
          <ul className="mt-3 space-y-2 text-sm text-cocoa/60">
            <li>Phone: +234 000 000 0000</li>
            <li>Email: hello@eandekiddies.com</li>
            <li>Lagos, Nigeria</li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
            Quick Links
          </h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/shop" className="text-cocoa/60 transition hover:text-gold">
                Shop
              </Link>
            </li>
            <li>
              <Link href="/cart" className="text-cocoa/60 transition hover:text-gold">
                Cart
              </Link>
            </li>
            <li>
              <Link
                href="/admin/login"
                className="text-cocoa/60 transition hover:text-gold"
              >
                Admin
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-cocoa/5 py-5 text-center text-xs text-cocoa/40">
        © {new Date().getFullYear()} E&amp;E Kiddies Wears. All rights reserved.
      </div>
    </footer>
  );
}
