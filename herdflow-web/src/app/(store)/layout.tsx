import type { ReactNode } from "react";
import { StoreHeader } from "@/components/store-header";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StoreHeader />
      <main className="min-h-screen bg-neutral-50">
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </section>
      </main>
      <footer className="bg-brand-navy text-white py-16 mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Footer Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-brand-green rounded-lg flex items-center justify-center text-white font-bold">
                  HF
                </div>
                <div>
                  <div className="font-bold">HerdFlow</div>
                  <div className="text-xs text-brand-green">Agricultural</div>
                </div>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                Connecting farmers with customers. Quality livestock and produce.
              </p>
            </div>

            {/* Shop */}
            <div>
              <h4 className="font-bold mb-4 text-brand-green">Store</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="/shop" className="hover:text-white transition">All Products</a></li>
                <li><a href="/shop" className="hover:text-white transition">Livestock</a></li>
                <li><a href="/shop" className="hover:text-white transition">Produce</a></li>
                <li><a href="/shop" className="hover:text-white transition">Supplies</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold mb-4 text-brand-green">Company</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="/about" className="hover:text-white transition">About Us</a></li>
                <li><a href="/contact" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold mb-4 text-brand-green">Legal</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition">Support</a></li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/20 pt-8">
            {/* Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="text-center">
                <div className="text-2xl mb-2">✓</div>
                <p className="text-xs font-semibold text-brand-green">Quality Assured</p>
                <p className="text-xs text-white/60">Premium products</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🚚</div>
                <p className="text-xs font-semibold text-brand-green">Fast Delivery</p>
                <p className="text-xs text-white/60">Nationwide shipping</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🤝</div>
                <p className="text-xs font-semibold text-brand-green">Fair Prices</p>
                <p className="text-xs text-white/60">Direct from farmers</p>
              </div>
              <div className="text-center">
                <div className="text-2xl mb-2">🔒</div>
                <p className="text-xs font-semibold text-brand-green">Secure</p>
                <p className="text-xs text-white/60">Protected transactions</p>
              </div>
            </div>

            <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-sm font-semibold text-white">Live auctions are accessible from inside the store.</p>
              <p className="mt-1 text-xs text-white/70">Open Shop to view products and auction entry points together.</p>
            </div>

            {/* Copyright */}
            <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/20">
              <p className="text-sm text-white/70">
                &copy; 2026 HerdFlow. All rights reserved. | Proudly South African 🇿🇦
              </p>
              <div className="flex gap-4 mt-4 md:mt-0">
                <a href="#" className="text-white/60 hover:text-white transition">Facebook</a>
                <a href="#" className="text-white/60 hover:text-white transition">Twitter</a>
                <a href="#" className="text-white/60 hover:text-white transition">Instagram</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
