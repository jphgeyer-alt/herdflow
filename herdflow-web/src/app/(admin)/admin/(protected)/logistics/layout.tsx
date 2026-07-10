"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const TABS = [
  { label: "Partners", href: "/admin/logistics" },
  { label: "Requests", href: "/admin/logistics/requests" },
  { label: "Payouts", href: "/admin/logistics/payouts" },
];

export default function LogisticsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1B3A6B]">Logistics</h1>
          <p className="mt-1 text-sm text-[#5d7497]">
            Manage transport partners, delivery requests, and payouts.
          </p>
        </div>
        <Link href="/admin" className="text-sm text-[#2E7D32] hover:underline">
          ← Dashboard
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[#e4ebf5] pb-2">
        {TABS.map((tab) => {
          const active =
            tab.href === "/admin/logistics" ? pathname === tab.href : pathname.startsWith(tab.href);
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
