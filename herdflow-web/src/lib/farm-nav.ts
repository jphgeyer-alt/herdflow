// herdflow-web/src/lib/farm-nav.ts
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, ArrowLeftRight, PlusCircle, ShoppingBag, FileBarChart, Receipt, Map } from "lucide-react";

export interface FarmNavItem {
  href: string;
  /** Key into this section's i18n namespace (see FarmShell's `namespace` prop) -- resolved by the consuming client component. */
  labelKey: string;
  icon: LucideIcon;
  /** Single-letter keyboard shortcut (F8) -- shown as a hint, bound in FarmShell. */
  shortcut?: string;
}

export const FARM_FINANCE_NAV: FarmNavItem[] = [
  { href: "/app/finance", labelKey: "nav_dashboard", icon: LayoutDashboard },
  { href: "/app/finance/transactions", labelKey: "transactions", icon: ArrowLeftRight },
  { href: "/app/finance/transactions/new", labelKey: "add_transaction", icon: PlusCircle, shortcut: "N" },
  { href: "/app/finance/purchases", labelKey: "purchases_acquisitions", icon: ShoppingBag },
  { href: "/app/finance/reports", labelKey: "reports_title", icon: FileBarChart, shortcut: "R" },
  { href: "/app/finance/vat", labelKey: "vat_summary", icon: Receipt },
];

// CAMPS-MAP: first nav section on web that isn't finance -- FarmShell/
// Sidebar/Topbar accept navItems/namespace/homeHref as props (defaulting to
// the finance values above) specifically so a second section like this one
// doesn't need its own copy of the shell.
export const FARM_CAMPS_NAV: FarmNavItem[] = [
  { href: "/app/camps", labelKey: "nav_map", icon: Map },
];
