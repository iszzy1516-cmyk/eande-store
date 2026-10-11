import Link from "next/link";

const SOCIALS = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/ee_kiddes_wears",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "TikTok",
    href: "https://www.tiktok.com/@eandekiddies",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M19.6 6.7a4.8 4.8 0 0 1-3.4-3.9V2h-3.3v13.1a2.9 2.9 0 1 1-2-2.75V8.95a6.2 6.2 0 1 0 5.3 6.2V8.6a8 8 0 0 0 4.4 1.3V6.7h-1z" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61579598052825",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.7c0-.9.3-1.6 1.7-1.6h1.5V4.2c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.9H8.2V14h2.6v8h2.7z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-cocoa/5 bg-sand">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
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
            <li>Phone: +234 704 021 7991</li>
            <li>Email: EEKIDDIESWEARS@YAHOO.COM</li>
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
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-gold">
            Follow Us
          </h4>
          <div className="mt-3 flex gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.name}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 text-gold transition hover:bg-gold hover:text-white"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-cocoa/5 py-5 text-center text-xs text-cocoa/40">
        © {new Date().getFullYear()} E&amp;E Kiddies Wears. All rights reserved.
      </div>
    </footer>
  );
}
