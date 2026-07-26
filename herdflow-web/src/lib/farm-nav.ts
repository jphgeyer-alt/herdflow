// herdflow-web/src/lib/farm-nav.ts
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, ArrowLeftRight, PlusCircle, ShoppingBag, FileBarChart, Receipt } from "lucide-react";

export interface FarmNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Single-letter keyboard shortcut (F8) -- shown as a hint, bound in FarmShell. */
  shortcut?: string;
}

export const FARM_FINANCE_NAV: FarmNavItem[] = [
  { href: "/app/finance", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/finance/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/app/finance/transactions/new", label: "Add Transaction", icon: PlusCircle, shortcut: "N" },
  { href: "/app/finance/purchases", label: "Purchases & Acquisitions", icon: ShoppingBag },
  { href: "/app/finance/reports", label: "Reports", icon: FileBarChart, shortcut: "R" },
  { href: "/app/finance/vat", label: "VAT Summary", icon: Receipt },
];
