"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";

const featureCards = [
  {
    title: "HERD MANAGEMENT",
    description: "Manage your herd on the go with powerful tools",
    image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600&q=80",
    href: "/shop",
  },
  {
    title: "TRUSTED PRODUCTS",
    description: "Shop quality products from trusted agricultural suppliers",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
    href: "/shop",
  },
  {
    title: "TRANSPORT SOLUTIONS",
    description: "Reliable livestock transport services",
    image: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&q=80",
    href: "/shop",
  },
  {
    title: "AUCTIONS",
    description: "Buy and sell livestock with confidence at our online auctions",
    image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&q=80",
    href: "/auction",
  },
  {
    title: "MARKETING & ADVERTISING",
    description: "Advertise your business, products or livestock",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&q=80",
    href: "/contact",
  },
];

const stats = [
  { value: "10 000+", label: "Active Farmers" },
  { value: "250 000+", label: "Herds Managed" },
  { value: "5 000+", label: "Products" },
  { value: "1 500+", label: "Auctions Completed" },
  { value: "2 000+", label: "Transport Bookings" },
];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white w-full overflow-x-hidden">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 shadow-lg w-full" style={{ backgroundColor: '#1B3A6B' }}>
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="relative">
                <svg className="w-12 h-12 text-white" viewBox="0 0 48 48" fill="currentColor">
                  <path d="M24 8c-4 0-8 2-10 5-1 2-2 4-2 7 0 5 3 9 8 11v8h8v-8c5-2 8-6 8-11 0-3-1-5-2-7-2-3-6-5-10-5z" />
                  <circle cx="24" cy="20" r="3" fill="white" />
                </svg>
              </div>
              <div className="leading-tight">
                <div className="text-2xl font-black text-white tracking-tight">HerdFlow</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-gold">
                  Smarter Herds. Stronger Futures.
                </div>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-8 text-sm font-semibold uppercase tracking-wide">
              <Link href="/" className="text-white border-b-2 border-green pb-1">
                Home
              </Link>
              <Link href="/about" className="text-white hover:text-white/80 transition">
                About Us
              </Link>
              <Link href="/shop" className="text-white hover:text-white/80 transition">
                Features
              </Link>
              <Link href="/shop" className="text-white hover:text-white/80 transition">
                Products
              </Link>
              <Link href="/auction" className="text-white hover:text-white/80 transition">
                Auctions
              </Link>
              <Link href="/contact" className="text-white hover:text-white/80 transition">
                Transport
              </Link>
              <Link href="/contact" className="text-white hover:text-white/80 transition">
                Marketing & Ads
              </Link>
              <Link href="/contact" className="text-white hover:text-white/80 transition">
                Contact
              </Link>
            </div>

            {/* Login Button */}
            <div className="flex items-center gap-4">
              <Link
                href="/admin/login"
                className="hidden lg:inline-flex rounded-lg px-6 py-2.5 text-sm font-bold uppercase text-white shadow-lg hover:opacity-90 transition"
                style={{ backgroundColor: '#2E7D32' }}
              >
                Login / Sign Up
              </Link>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden text-white p-2"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="lg:hidden pb-4 space-y-2">
              <Link href="/" className="block px-4 py-2 text-white font-semibold">
                Home
              </Link>
              <Link href="/about" className="block px-4 py-2 text-white hover:text-white/80">
                About Us
              </Link>
              <Link href="/shop" className="block px-4 py-2 text-white hover:text-white/80">
                Products
              </Link>
              <Link href="/auction" className="block px-4 py-2 text-white hover:text-white/80">
                Auctions
              </Link>
              <Link href="/contact" className="block px-4 py-2 text-white hover:text-white/80">
                Contact
              </Link>
              <Link
                href="/admin/login"
                className="block mx-4 mt-4 rounded-lg px-6 py-2.5 text-center text-sm font-bold uppercase text-white"
                style={{ backgroundColor: '#2E7D32' }}
              >
                Login / Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative w-full max-w-full min-h-[85vh] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1920&q=80')",
          }}
        />
        {/* TODO: Replace with licensed HerdFlow photo */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 md:gap-12 items-center">
            {/* Left Side - Text */}
            <div className="text-white space-y-4 md:space-y-6">
              <p className="inline-block rounded-full bg-green/20 border border-green px-4 md:px-6 py-2 text-xs font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] text-green">
                The all-in-one platform for the agricultural community
              </p>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-tight w-full break-words hyphens-auto uppercase">
                The all-in-one platform for the agricultural community
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl leading-relaxed text-white/90 max-w-2xl">
                HerdFlow brings everything farmers need into one powerful platform. Manage your herd, buy trusted products, book transport, bid at auctions and advertise to the right audience.
              </p>

              <div className="flex flex-wrap gap-3 md:gap-4 pt-2 md:pt-4">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-lg bg-green px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-bold uppercase tracking-wide text-white shadow-xl hover:bg-green-light transition"
                >
                  Get Started
                </Link>
                <button className="inline-flex items-center gap-2 md:gap-3 rounded-lg border-2 border-white bg-transparent px-6 md:px-8 py-3 md:py-4 text-sm md:text-base font-bold uppercase tracking-wide text-white hover:bg-white/10 transition">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Watch Video
                </button>
              </div>
            </div>

            {/* Right Side - Trust Box */}
            <div className="relative w-full">
              <div className="rounded-3xl bg-navy/95 p-6 md:p-8 shadow-2xl backdrop-blur border-4 border-gold/30">
                <div className="space-y-4 md:space-y-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-green flex-shrink-0" />
                    <span className="text-xl md:text-2xl font-black uppercase text-white tracking-wide">
                      Trusted.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-green flex-shrink-0" />
                    <span className="text-xl md:text-2xl font-black uppercase text-white tracking-wide">
                      Connected.
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-green flex-shrink-0" />
                    <span className="text-xl md:text-2xl font-black uppercase text-white tracking-wide">
                      Empowered.
                    </span>
                  </div>
                  <div className="pt-3 md:pt-4 border-t border-white/20">
                    <p className="text-xl md:text-2xl italic text-gold font-serif">Growing Together.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE CARDS SECTION */}
      <section className="w-full overflow-hidden py-12 md:py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            {featureCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group relative w-full overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative w-full aspect-[4/3]">
                  {/* Background Image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${card.image}')` }}
                  />
                  {/* Dark Overlay */}
                  <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition" />
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    <div className="space-y-1 md:space-y-2">
                      <h3 className="text-base md:text-xl font-black uppercase text-white tracking-wide">
                        {card.title}
                      </h3>
                      <p className="text-xs md:text-sm text-white/90 leading-relaxed">
                        {card.description}
                      </p>
                      <div className="pt-1 md:pt-2">
                        <span className="inline-flex items-center gap-2 text-xs md:text-sm font-bold uppercase text-green">
                          Learn More →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="w-full bg-navy py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-8 md:gap-12 items-center">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-green mb-3 md:mb-4">
                    <CheckCircle2 className="w-6 h-6 md:w-8 md:h-8 text-green" />
                  </div>
                  <div className="text-2xl md:text-4xl font-black text-white">{stat.value}</div>
                  <div className="text-xs md:text-sm text-white/70 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Right Text */}
            <div className="text-center lg:text-right space-y-2">
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                <span className="text-white">One Platform.</span>
                <br />
                <span className="text-green">Endless Possibilities.</span>
              </h3>
              <p className="text-lg md:text-xl italic text-gold-light font-serif">
                Managing Today. Building Tomorrow.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
