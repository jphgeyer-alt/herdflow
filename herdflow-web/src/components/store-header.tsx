'use client';

import Link from 'next/link';
import { ShoppingCart, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function StoreHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/shop" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-navy to-brand-green rounded-lg flex items-center justify-center text-white text-xs font-bold">
              HF
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-brand-navy font-bold">HerdFlow</span>
              <span className="text-xs text-brand-green font-semibold">Agricultural Marketplace</span>
            </div>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="/shop" 
              className="text-neutral-700 hover:text-brand-green font-medium transition relative group"
            >
              Shop
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-green group-hover:w-full transition-all" />
            </Link>
            <Link 
              href="/auction" 
              className="text-neutral-700 hover:text-brand-green font-medium transition relative group"
            >
              Live Auctions
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-green group-hover:w-full transition-all" />
            </Link>
            <Link 
              href="/about" 
              className="text-neutral-700 hover:text-brand-green font-medium transition relative group"
            >
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-green group-hover:w-full transition-all" />
            </Link>
            <Link 
              href="/contact" 
              className="text-neutral-700 hover:text-brand-green font-medium transition relative group"
            >
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-green group-hover:w-full transition-all" />
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button className="hidden md:flex p-2 text-neutral-700 hover:text-brand-green transition">
              <Search size={20} />
            </button>
            <Link 
              href="/cart"
              className="relative p-2 text-neutral-700 hover:text-brand-green transition"
            >
              <ShoppingCart size={20} />
              <span className="absolute -top-1 -right-1 bg-brand-green text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                0
              </span>
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-neutral-700 hover:text-brand-green transition"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="md:hidden pb-4 space-y-2">
            <Link href="/shop" className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded">
              Shop
            </Link>
            <Link href="/auction" className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded">
              Live Auctions
            </Link>
            <Link href="/about" className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded">
              About
            </Link>
            <Link href="/contact" className="block px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded">
              Contact
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
