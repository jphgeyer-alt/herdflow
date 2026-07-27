// herdflow-web/src/lib/farm-nav.ts
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, ArrowLeftRight, PlusCircle, ShoppingBag, FileBarChart, Receipt } from "lucide-react";

export interface FarmNavItem {
  href: string;
  /** Key into the "finance" i18n namespace -- resolved by the consuming client component. */
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
