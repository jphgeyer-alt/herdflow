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
          <h1 className="text-navy-600 text-2xl font-black">Marketing & Sponsors</h1>
          <p className="mt-1 text-sm text-navy-300">
            Manage sponsors, pricing packages, quotes and invoices.
          </p>
        </div>
        <Link href="/admin" className="text-green text-sm hover:underline">
          ← Dashboard
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-navy-100 pb-2">
        {TABS.map((tab) => {
          const active =
            tab.href === "/admin/marketing" ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                active
                  ? "bg-navy-600 text-white"
                  : "border border-navy-100 bg-white text-navy-300 hover:border-navy-600"
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
