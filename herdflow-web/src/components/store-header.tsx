"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Search,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  Package,
  Truck,
  List,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart-context";

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
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user || null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setUserMenuOpen(false);
    router.push("/");
  }

  const getDashboardLink = () => {
    if (user?.sellerProfile) return "/dashboard/seller";
    if (user?.logisticsProfile) return "/dashboard/logistics";
    return "/dashboard/buyer";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1B3A6B] bg-[#1B3A6B] shadow-sm">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="HerdFlow"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold text-white">HerdFlow</span>
              <span className="hidden text-[10px] font-semibold text-[#A07C3A] sm:block">
                Agricultural Marketplace
              </span>
            </div>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="scrollbar-none hidden flex-nowrap items-center gap-4 overflow-x-auto md:flex xl:gap-5">
            <Link
              href="/"
              className="group relative whitespace-nowrap text-sm font-medium text-white transition hover:text-[#A07C3A]"
            >
              Home
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#A07C3A] transition-all group-hover:w-full" />
            </Link>
            <Link
              href="/about"
              className="group relative whitespace-nowrap text-sm font-medium text-white transition hover:text-[#A07C3A]"
            >
              About Us
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#A07C3A] transition-all group-hover:w-full" />
            </Link>
            <Link
              href="/#features"
              className="group relative whitespace-nowrap text-sm font-medium text-white transition hover:text-[#A07C3A]"
            >
              Features
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#A07C3A] transition-all group-hover:w-full" />
            </Link>
            <Link
              href="/shop"
              className="group relative whitespace-nowrap text-sm font-medium text-white transition hover:text-[#A07C3A]"
            >
              Products
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#A07C3A] transition-all group-hover:w-full" />
            </Link>
            <Link
              href="/listings"
              className="group relative whitespace-nowrap text-sm font-medium text-white transition hover:text-[#A07C3A]"
            >
              Livestock
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#A07C3A] transition-all group-hover:w-full" />
            </Link>
            <Link
              href="/auction"
              className="group relative whitespace-nowrap text-sm font-medium text-white transition hover:text-[#A07C3A]"
            >
              Auctions
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#A07C3A] transition-all group-hover:w-full" />
            </Link>
            <Link
              href="/finance"
              className="group relative whitespace-nowrap text-sm font-medium text-white transition hover:text-[#A07C3A]"
            >
              Farm Finance
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#A07C3A] transition-all group-hover:w-full" />
            </Link>
            <Link
              href="/classifieds"
              className="group relative whitespace-nowrap text-sm font-medium text-white transition hover:text-[#A07C3A]"
            >
              Classifieds
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#A07C3A] transition-all group-hover:w-full" />
            </Link>
            <Link
              href="/directory"
              className="group relative whitespace-nowrap text-sm font-medium text-white transition hover:text-[#A07C3A]"
            >
              Directory
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#A07C3A] transition-all group-hover:w-full" />
            </Link>
            <Link
              href="/resources"
              className="group relative whitespace-nowrap text-sm font-medium text-white transition hover:text-[#A07C3A]"
            >
              Resources
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#A07C3A] transition-all group-hover:w-full" />
            </Link>
            <Link
              href="/register/logistics"
              className="group relative whitespace-nowrap text-sm font-medium text-white transition hover:text-[#A07C3A]"
            >
              Transport
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#A07C3A] transition-all group-hover:w-full" />
            </Link>
            <Link
              href="/marketing"
              className="group relative whitespace-nowrap text-sm font-medium text-white transition hover:text-[#A07C3A]"
            >
              Marketing & Ads
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#A07C3A] transition-all group-hover:w-full" />
            </Link>
            <Link
              href="/contact"
              className="group relative whitespace-nowrap text-sm font-medium text-white transition hover:text-[#A07C3A]"
            >
              Contact
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#A07C3A] transition-all group-hover:w-full" />
            </Link>
            <Link
              href="/download"
              className="ml-1 whitespace-nowrap rounded-lg bg-[#A07C3A] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#8a6830]"
            >
              📱 Download App
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <button className="hidden p-2 text-white transition hover:text-[#A07C3A] md:flex">
              <Search size={20} />
            </button>
            <button
              onClick={openDrawer}
              className="relative p-2 text-white transition hover:text-[#A07C3A]"
            >
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#2E7D32] text-xs font-bold text-white">
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
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2E7D32] text-sm font-bold uppercase text-white transition hover:bg-[#1d5e20]"
                      title={user.fullName}
                    >
                      {user.fullName.charAt(0)}
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[#e4ebf5] bg-white py-2 shadow-xl">
                        <Link
                          href={getDashboardLink()}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-[#244367] transition hover:bg-[#f5f8fd]"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User size={16} />
                          My Dashboard
                        </Link>
                        {!user.sellerProfile && !user.logisticsProfile && (
                          <Link
                            href="/orders"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-[#244367] transition hover:bg-[#f5f8fd]"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Package size={16} />
                            My Orders
                          </Link>
                        )}
                        {user.sellerProfile && (
                          <Link
                            href="/dashboard/seller"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-[#244367] transition hover:bg-[#f5f8fd]"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <List size={16} />
                            My Listings
                          </Link>
                        )}
                        {user.logisticsProfile && (
                          <Link
                            href="/dashboard/logistics"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-[#244367] transition hover:bg-[#f5f8fd]"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Truck size={16} />
                            My Fleet
                          </Link>
                        )}
                        <Link
                          href="/account/settings"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-[#244367] transition hover:bg-[#f5f8fd]"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings size={16} />
                          Account Settings
                        </Link>
                        <div className="my-2 border-t border-[#e4ebf5]" />
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
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
                    className="hidden items-center gap-2 rounded-lg bg-[#2E7D32] px-6 py-2 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#1d5e20] md:inline-flex"
                  >
                    Login / Sign Up
                  </Link>
                )}
              </>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-white transition hover:text-[#A07C3A] md:hidden"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <nav className="space-y-2 pb-4 md:hidden">
            <Link href="/" className="block rounded px-4 py-2 text-white hover:bg-white/10">
              Home
            </Link>
            <Link href="/about" className="block rounded px-4 py-2 text-white hover:bg-white/10">
              About Us
            </Link>
            <Link
              href="/#features"
              className="block rounded px-4 py-2 text-white hover:bg-white/10"
            >
              Features
            </Link>
            <Link href="/shop" className="block rounded px-4 py-2 text-white hover:bg-white/10">
              Products
            </Link>
            <Link href="/listings" className="block rounded px-4 py-2 text-white hover:bg-white/10">
              Livestock
            </Link>
            <Link href="/auction" className="block rounded px-4 py-2 text-white hover:bg-white/10">
              Auctions
            </Link>
            <Link href="/finance" className="block rounded px-4 py-2 text-white hover:bg-white/10">
              Farm Finance
            </Link>
            <Link href="/classifieds" className="block rounded px-4 py-2 text-white hover:bg-white/10">
              Classifieds
            </Link>
            <Link href="/directory" className="block rounded px-4 py-2 text-white hover:bg-white/10">
              Directory
            </Link>
            <Link href="/resources" className="block rounded px-4 py-2 text-white hover:bg-white/10">
              Resources
            </Link>
            <Link
              href="/register/logistics"
              className="block rounded px-4 py-2 text-white hover:bg-white/10"
            >
              Transport
            </Link>
            <Link
              href="/marketing"
              className="block rounded px-4 py-2 text-white hover:bg-white/10"
            >
              Marketing & Ads
            </Link>
            <Link href="/contact" className="block rounded px-4 py-2 text-white hover:bg-white/10">
              Contact
            </Link>
            <Link
              href="/download"
              className="mx-4 block rounded-lg bg-[#A07C3A] py-2 text-center text-sm font-bold text-white"
              onClick={() => setMenuOpen(false)}
            >
              📱 Download App
            </Link>
            {!loading && (
              <>
                {user ? (
                  <>
                    <div className="my-2 border-t border-white/20" />
                    <Link
                      href={getDashboardLink()}
                      className="block rounded px-4 py-2 text-white hover:bg-white/10"
                      onClick={() => setMenuOpen(false)}
                    >
                      My Dashboard
                    </Link>
                    {!user.sellerProfile && !user.logisticsProfile && (
                      <Link
                        href="/orders"
                        className="block rounded px-4 py-2 text-white hover:bg-white/10"
                        onClick={() => setMenuOpen(false)}
                      >
                        My Orders
                      </Link>
                    )}
                    {user.sellerProfile && (
                      <Link
                        href="/dashboard/seller"
                        className="block rounded px-4 py-2 text-white hover:bg-white/10"
                        onClick={() => setMenuOpen(false)}
                      >
                        My Listings
                      </Link>
                    )}
                    {user.logisticsProfile && (
                      <Link
                        href="/dashboard/logistics"
                        className="block rounded px-4 py-2 text-white hover:bg-white/10"
                        onClick={() => setMenuOpen(false)}
                      >
                        My Fleet
                      </Link>
                    )}
                    <Link
                      href="/account/settings"
                      className="block rounded px-4 py-2 text-white hover:bg-white/10"
                      onClick={() => setMenuOpen(false)}
                    >
                      Account Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full rounded px-4 py-2 text-left text-red-300 hover:bg-white/10"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <div className="my-2 border-t border-white/20" />
                    <Link
                      href="/auth/login"
                      className="block rounded px-4 py-2 font-bold text-white hover:bg-white/10"
                    >
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
