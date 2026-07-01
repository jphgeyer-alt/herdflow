'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, Menu, X, User, LogOut, Settings, Package, Truck, List } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '@/lib/cart-context';

type UserData = {
  id: string;
  email: string;
  fullName: string;
  sellerProfile?: { id: string; farmName: string; status: string } | null;
  logisticsProfile?: { id: string; companyName: string; status: string } | null;
};

export function StoreHeader() {
  const router = useRouter();
  const { totalItems, openDrawer } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user || null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setUserMenuOpen(false);
    router.push('/');
  }

  const getDashboardLink = () => {
    if (user?.sellerProfile) return '/dashboard/seller';
    if (user?.logisticsProfile) return '/dashboard/logistics';
    return '/dashboard/buyer';
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#1B3A6B] border-b border-[#1B3A6B] shadow-sm">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
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
              href="/listings" 
              className="text-white hover:text-[#A07C3A] font-medium transition relative group"
            >
              Livestock
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
            <button 
              onClick={openDrawer}
              className="relative p-2 text-white hover:text-[#A07C3A] transition"
            >
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#2E7D32] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User Menu or Login */}
            {!loading && (
              <>
                {user ? (
                  <div className="relative hidden md:block">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-white text-sm font-semibold"
                    >
                      <User size={16} />
                      {user.fullName.split(' ')[0]}
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-[#e4ebf5] py-2">
                        <Link
                          href={getDashboardLink()}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-[#244367] hover:bg-[#f5f8fd] transition"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User size={16} />
                          My Dashboard
                        </Link>
                        {!user.sellerProfile && !user.logisticsProfile && (
                          <Link
                            href="/orders"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-[#244367] hover:bg-[#f5f8fd] transition"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Package size={16} />
                            My Orders
                          </Link>
                        )}
                        {user.sellerProfile && (
                          <Link
                            href="/dashboard/seller"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-[#244367] hover:bg-[#f5f8fd] transition"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <List size={16} />
                            My Listings
                          </Link>
                        )}
                        {user.logisticsProfile && (
                          <Link
                            href="/dashboard/logistics"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-[#244367] hover:bg-[#f5f8fd] transition"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Truck size={16} />
                            My Fleet
                          </Link>
                        )}
                        <Link
                          href="/settings"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-[#244367] hover:bg-[#f5f8fd] transition"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings size={16} />
                          Account Settings
                        </Link>
                        <div className="border-t border-[#e4ebf5] my-2" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition w-full text-left"
                        >
                          <LogOut size={16} />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/auth/login"
                    className="hidden md:inline-flex items-center gap-2 px-6 py-2 bg-[#2E7D32] hover:bg-[#1d5e20] rounded-lg text-white text-sm font-bold uppercase tracking-wide transition"
                  >
                    Login / Sign Up
                  </Link>
                )}
              </>
            )}

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
            <Link href="/listings" className="block px-4 py-2 text-white hover:bg-white/10 rounded">
              Livestock
            </Link>
            <Link href="/about" className="block px-4 py-2 text-white hover:bg-white/10 rounded">
              About
            </Link>
            <Link href="/contact" className="block px-4 py-2 text-white hover:bg-white/10 rounded">
              Contact
            </Link>
            {!loading && (
              <>
                {user ? (
                  <>
                    <div className="border-t border-white/20 my-2" />
                    <Link href={getDashboardLink()} className="block px-4 py-2 text-white hover:bg-white/10 rounded">
                      My Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-white hover:bg-white/10 rounded"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <div className="border-t border-white/20 my-2" />
                    <Link href="/auth/login" className="block px-4 py-2 text-white hover:bg-white/10 rounded font-bold">
                      Login / Sign Up
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
