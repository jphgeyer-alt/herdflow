'use client';

import Link from 'next/link';
import { ShoppingCart, Search, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function StoreHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#1B3A6B] border-b border-[#1B3A6B] shadow-sm">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/shop" className="flex items-center gap-2 font-bold text-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-white to-green-200 rounded-lg flex items-center justify-center text-[#1B3A6B] text-xs font-bold">
              HF
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-white font-bold">HerdFlow</span>
              <span className="text-xs text-[#A07C3A] font-semibold">Agricultural Marketplace</span>
            </div>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="/shop" 
              className="text-white hover:text-[#A07C3A] font-medium transition relative group"
            >
              Shop
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#A07C3A] group-hover:w-full transition-all" />
            </Link>
            <Link 
              href="/about" 
              className="text-white hover:text-[#A07C3A] font-medium transition relative group"
            >
              About
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#A07C3A] group-hover:w-full transition-all" />
            </Link>
            <Link 
              href="/contact" 
              className="text-white hover:text-[#A07C3A] font-medium transition relative group"
            >
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#A07C3A] group-hover:w-full transition-all" />
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button className="hidden md:flex p-2 text-white hover:text-[#A07C3A] transition">
              <Search size={20} />
            </button>
            <Link 
              href="/cart"
              className="relative p-2 text-white hover:text-[#A07C3A] transition"
            >
              <ShoppingCart size={20} />
              <span className="absolute -top-1 -right-1 bg-[#2E7D32] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                0
              </span>
            </Link>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-white hover:text-[#A07C3A] transition"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="md:hidden pb-4 space-y-2">
            <Link href="/shop" className="block px-4 py-2 text-white hover:bg-white/10 rounded">
              Shop
            </Link>
            <Link href="/about" className="block px-4 py-2 text-white hover:bg-white/10 rounded">
              About
            </Link>
            <Link href="/contact" className="block px-4 py-2 text-white hover:bg-white/10 rounded">
              Contact
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
