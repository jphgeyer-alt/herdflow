"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { FARM_FINANCE_NAV, type FarmNavItem } from "@/lib/farm-nav";

// F8: keyboard shortcuts for power users -- N = new transaction, R =
// reports, F = filter. Ignored while typing in a form field so a farmer
// typing "Fuel" into the description box doesn't get yanked to Reports.
// Guarded to the finance section (homeHref) -- CAMPS-MAP added a second
// FarmShell section, and without this guard pressing "n" there would
// silently navigate away to Finance's new-transaction page.
function useFinanceShortcuts(homeHref: string) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.startsWith("/app/finance")) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        router.push("/app/finance/transactions/new");
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        router.push("/app/finance/reports");
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        // Pages with a filter bar (Transactions) listen for this and focus
        // their own filter input -- a global shortcut can't know which
        // element that is on every page, so it's a broadcast, not a route.
        window.dispatchEvent(new CustomEvent("farm-finance:focus-filter"));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, pathname, homeHref]);
}

export function FarmShell({
  fullName,
  mobileRole,
  farmName,
  children,
  navItems = FARM_FINANCE_NAV,
  namespace = "finance",
  homeHref = "/app/finance",
  sectionLabelKey = "farm_financials",
}: {
  fullName: string;
  mobileRole: string;
  farmName: string;
  children: React.ReactNode;
  navItems?: FarmNavItem[];
  namespace?: string;
  homeHref?: string;
  sectionLabelKey?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useFinanceShortcuts(homeHref);

  return (
    <div className="min-h-screen bg-navy-25 lg:flex">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        farmName={farmName}
        navItems={navItems}
        namespace={namespace}
        homeHref={homeHref}
        sectionLabelKey={sectionLabelKey}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          fullName={fullName}
          mobileRole={mobileRole}
          onMenuClick={() => setSidebarOpen(true)}
          navItems={navItems}
          namespace={namespace}
          homeHref={homeHref}
          sectionLabelKey={sectionLabelKey}
        />
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
