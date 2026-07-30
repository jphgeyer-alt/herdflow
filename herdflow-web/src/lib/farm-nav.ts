// herdflow-web/src/lib/farm-nav.ts
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PlusCircle,
  ShoppingBag,
  FileBarChart,
  Receipt,
  Map,
  PawPrint,
  HeartPulse,
  Syringe,
  Pill,
  LineChart,
  UserCircle,
  Users,
  Activity,
} from "lucide-react";

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

export const FARM_HERD_NAV: FarmNavItem[] = [
  { href: "/app/herd", labelKey: "nav_animals", icon: PawPrint },
  { href: "/app/herd/new", labelKey: "add_animal", icon: PlusCircle, shortcut: "N" },
];

export const FARM_HEALTH_NAV: FarmNavItem[] = [
  { href: "/app/health", labelKey: "nav_history", icon: HeartPulse },
  { href: "/app/health/new", labelKey: "add_health_event", icon: PlusCircle, shortcut: "N" },
  { href: "/app/health/vaccinations", labelKey: "nav_vaccinations", icon: Syringe },
  { href: "/app/health/medicines", labelKey: "nav_medicines", icon: Pill },
];

export const FARM_MARKET_NAV: FarmNavItem[] = [
  { href: "/app/market", labelKey: "nav_prices", icon: LineChart },
];

export const FARM_PROFILE_NAV: FarmNavItem[] = [
  { href: "/app/profile", labelKey: "nav_farm_profile", icon: UserCircle },
  { href: "/app/profile/team", labelKey: "nav_team", icon: Users },
  { href: "/app/profile/activity", labelKey: "nav_activity", icon: Activity },
];

export interface FarmSectionConfig {
  navItems: FarmNavItem[];
  namespace: string;
  homeHref: string;
  sectionLabelKey: string;
}

// A server layout can't pass FARM_X_NAV (icon component references) as a
// prop into a "use client" component -- React Server Components only allow
// plain serializable data across that boundary, and a component reference is
// a function, so Next throws "Functions cannot be passed directly to Client
// Components" at request time (this broke the *existing* Camps section the
// same way -- caught live-testing the sections added here, see FarmShell).
// Each section's config is resolved from this plain-string key entirely
// inside the client components (FarmShell/Sidebar/Topbar), so only the key
// itself -- a string -- ever crosses the server/client boundary.
export const FARM_SECTIONS = {
  finance: {
    navItems: FARM_FINANCE_NAV,
    namespace: "finance",
    homeHref: "/app/finance",
    sectionLabelKey: "farm_financials",
  },
  camps: {
    navItems: FARM_CAMPS_NAV,
    namespace: "camps",
    homeHref: "/app/camps",
    sectionLabelKey: "camps_section_title",
  },
  herd: {
    navItems: FARM_HERD_NAV,
    namespace: "herd",
    homeHref: "/app/herd",
    sectionLabelKey: "herd_section_title",
  },
  health: {
    navItems: FARM_HEALTH_NAV,
    namespace: "health",
    homeHref: "/app/health",
    sectionLabelKey: "health_section_title",
  },
  market: {
    navItems: FARM_MARKET_NAV,
    namespace: "market",
    homeHref: "/app/market",
    sectionLabelKey: "market_section_title",
  },
  profile: {
    navItems: FARM_PROFILE_NAV,
    namespace: "profile",
    homeHref: "/app/profile",
    sectionLabelKey: "profile_section_title",
  },
} as const satisfies Record<string, FarmSectionConfig>;

export type FarmSectionKey = keyof typeof FARM_SECTIONS;
