import type { ReactNode } from "react";
import { StoreHeader } from "@/components/store-header";
import { prisma } from "@/lib/prisma";

export default async function StoreLayout({ children }: { children: ReactNode }) {
  const partnerLinks = await prisma.affiliateLink
    .findMany({
      where: { placement: "FOOTER", isActive: true },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    })
    .catch(() => []);

  return (
    <>
      <StoreHeader />
      <main className="min-h-screen">{children}</main>
      <footer className="bg-brand-navy mt-20 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Footer Grid */}
          <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-5">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4 flex items-center gap-2">
                <div className="bg-brand-green flex h-10 w-10 items-center justify-center rounded-lg font-bold text-white">
                  HF
                </div>
                <div>
                  <div className="font-bold">HerdFlow</div>
                  <div className="text-brand-green text-xs">Agricultural</div>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-white/70">
                Connecting farmers with customers. Quality livestock and produce.
              </p>
            </div>

            {/* Shop */}
            <div>
              <h4 className="text-brand-green mb-4 font-bold">Store</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>
                  <a href="/shop" className="transition hover:text-white">
                    All Products
                  </a>
                </li>
                <li>
                  <a href="/listings" className="transition hover:text-white">
                    Livestock
                  </a>
                </li>
                <li>
                  <a href="/auction" className="transition hover:text-white">
                    Live Auctions
                  </a>
                </li>
                <li>
                  <a href="/checkout" className="transition hover:text-white">
                    Checkout
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-brand-green mb-4 font-bold">Company</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>
                  <a href="/about" className="transition hover:text-white">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="/contact" className="transition hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="/register/seller" className="transition hover:text-white">
                    Sell on HerdFlow
                  </a>
                </li>
                <li>
                  <a href="/register/logistics" className="transition hover:text-white">
                    Logistics Partners
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-brand-green mb-4 font-bold">Legal</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li>
                  <a href="/privacy" className="transition hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="transition hover:text-white">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/contact" className="transition hover:text-white">
                    Support
                  </a>
                </li>
                <li>
                  <a href="/auth/register" className="transition hover:text-white">
                    Create Account
                  </a>
                </li>
                <li>
                  <a
                    href="/download"
                    className="font-semibold text-[#A07C3A] transition hover:text-white"
                  >
                    📱 Download App
                  </a>
                </li>
              </ul>
            </div>

            {/* Partners (affiliate links) */}
            {partnerLinks.length > 0 && (
              <div>
                <h4 className="text-brand-green mb-4 font-bold">Partners</h4>
                <ul className="space-y-2 text-sm text-white/70">
                  {partnerLinks.map((link) => (
                    <li key={link.id}>
                      <a
                        href={`/api/go/${link.id}`}
                        target="_blank"
                        rel="sponsored nofollow"
                        className="transition hover:text-white"
                      >
                        {link.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-white/20 pt-8">
            {/* Features */}
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="mb-2 text-2xl">✓</div>
                <p className="text-brand-green text-xs font-semibold">Quality Assured</p>
                <p className="text-xs text-white/60">Premium products</p>
              </div>
              <div className="text-center">
                <div className="mb-2 text-2xl">🚚</div>
                <p className="text-brand-green text-xs font-semibold">Fast Delivery</p>
                <p className="text-xs text-white/60">Nationwide shipping</p>
              </div>
              <div className="text-center">
                <div className="mb-2 text-2xl">🤝</div>
                <p className="text-brand-green text-xs font-semibold">Fair Prices</p>
                <p className="text-xs text-white/60">Direct from farmers</p>
              </div>
              <div className="text-center">
                <div className="mb-2 text-2xl">🔒</div>
                <p className="text-brand-green text-xs font-semibold">Secure</p>
                <p className="text-xs text-white/60">Protected transactions</p>
              </div>
            </div>

            <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-sm font-semibold text-white">
                Live auctions are accessible from inside the store.
              </p>
              <p className="mt-1 text-xs text-white/70">
                Open Shop to view products and auction entry points together.
              </p>
            </div>

            {/* Copyright */}
            <div className="flex flex-col items-center justify-between border-t border-white/20 pt-8 md:flex-row">
              <p className="text-sm text-white/70">
                &copy; 2026 HerdFlow. All rights reserved. | Proudly South African 🇿🇦
              </p>
              <div className="mt-4 flex gap-4 md:mt-0">
                <a
                  href="https://www.facebook.com/share/1cUWCfQwut/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 transition hover:text-[#1877F2]"
                >
                  Facebook
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 transition hover:text-white"
                >
                  Twitter
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 transition hover:text-white"
                >
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
