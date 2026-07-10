"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export function HomeNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full shadow-lg" style={{ backgroundColor: "#1B3A6B" }}>
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="HerdFlow logo"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
            <div className="leading-tight">
              <div className="text-xl font-black tracking-tight text-white">HerdFlow</div>
              <div className="text-gold hidden text-[9px] font-bold uppercase tracking-[0.12em] xl:block">
                Smarter Herds. Stronger Futures.
              </div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden flex-nowrap items-center gap-4 text-xs font-semibold uppercase tracking-normal lg:flex xl:gap-5">
            <Link href="/" className="border-green whitespace-nowrap border-b-2 pb-0.5 text-white">
              Home
            </Link>
            <Link href="/about" className="whitespace-nowrap text-white transition hover:text-white/80">
              About Us
            </Link>
            <Link href="#features" className="whitespace-nowrap text-white transition hover:text-white/80">
              Features
            </Link>
            <Link href="/shop" className="whitespace-nowrap text-white transition hover:text-white/80">
              Products
            </Link>
            <Link href="/listings" className="whitespace-nowrap text-white transition hover:text-white/80">
              Livestock
            </Link>
            <Link href="/auction" className="whitespace-nowrap text-white transition hover:text-white/80">
              Auctions
            </Link>
            <Link
              href="/register/logistics"
              className="whitespace-nowrap text-white transition hover:text-white/80"
            >
              Transport
            </Link>
            <Link href="/marketing" className="whitespace-nowrap text-white transition hover:text-white/80">
              Marketing
            </Link>
            <Link href="/contact" className="whitespace-nowrap text-white transition hover:text-white/80">
              Contact
            </Link>
          </div>

          {/* Login Button */}
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href="/auth/login"
              className="hidden whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold uppercase text-white shadow-lg transition hover:opacity-90 lg:inline-flex"
              style={{ backgroundColor: "#2E7D32" }}
            >
              Login / Sign Up
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-white lg:hidden"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="space-y-1 border-t border-white/20 pb-4 pt-2 lg:hidden">
            <Link
              href="/"
              className="block rounded-lg px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/about"
              className="block rounded-lg px-4 py-2.5 text-sm text-white hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              About Us
            </Link>
            <Link
              href="#features"
              className="block rounded-lg px-4 py-2.5 text-sm text-white hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/shop"
              className="block rounded-lg px-4 py-2.5 text-sm text-white hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              Products
            </Link>
            <Link
              href="/listings"
              className="block rounded-lg px-4 py-2.5 text-sm text-white hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              Livestock
            </Link>
            <Link
              href="/auction"
              className="block rounded-lg px-4 py-2.5 text-sm text-white hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              Auctions
            </Link>
            <Link
              href="/register/logistics"
              className="block rounded-lg px-4 py-2.5 text-sm text-white hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              Transport
            </Link>
            <Link
              href="/marketing"
              className="block rounded-lg px-4 py-2.5 text-sm text-white hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              Marketing & Ads
            </Link>
            <Link
              href="/contact"
              className="block rounded-lg px-4 py-2.5 text-sm text-white hover:bg-white/10"
              onClick={() => setMenuOpen(false)}
            >
              Contact
            </Link>
            <div className="px-4 pt-2">
              <Link
                href="/auth/login"
                className="block rounded-lg px-6 py-2.5 text-center text-sm font-bold uppercase text-white"
                style={{ backgroundColor: "#2E7D32" }}
                onClick={() => setMenuOpen(false)}
              >
                Login / Sign Up
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
