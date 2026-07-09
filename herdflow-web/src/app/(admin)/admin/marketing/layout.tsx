"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const TABS = [
  { label: "Sponsors", href: "/admin/marketing" },
  { label: "Packages", href: "/admin/marketing/packages" },
  { label: "Quotes", href: "/admin/marketing/quotes" },
  { label: "Invoices", href: "/admin/marketing/invoices" },
  { label: "Creative", href: "/admin/marketing/creative" },
];

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1B3A6B]">Marketing & Sponsors</h1>
          <p className="mt-1 text-sm text-[#5d7497]">
            Manage sponsors, pricing packages, quotes and invoices.
          </p>
        </div>
        <Link href="/admin" className="text-sm text-[#2E7D32] hover:underline">
          ← Dashboard
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[#e4ebf5] pb-2">
        {TABS.map((tab) => {
          const active =
            tab.href === "/admin/marketing" ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                active
                  ? "bg-[#1B3A6B] text-white"
                  : "border border-[#cdd8e7] bg-white text-[#5d7497] hover:border-[#1B3A6B]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
