import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Activity,
  Tags,
  ShoppingCart,
  Store,
  Users,
  Truck,
  ClipboardList,
  Wallet,
  Receipt,
  BarChart3,
  Megaphone,
  Gavel,
  FileEdit,
  Smartphone,
  CreditCard,
  ShieldCheck,
  DollarSign,
  UserCog,
  TrendingUp,
  Palette,
  HandCoins,
  ListChecks,
  BookOpen,
  FileDown,
  Link2,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

/**
 * Single source of truth for admin navigation — the sidebar reads this
 * directly, and the dashboard's "Admin Sections" grid is generated from it
 * too, so the two can no longer drift apart the way the old hardcoded array
 * did.
 */
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin", description: "Sales, approvals, and activity at a glance", icon: LayoutDashboard },
      { label: "Activity Log", href: "/admin/activity", description: "Audit trail of every admin action", icon: Activity },
    ],
  },
  {
    label: "Commerce",
    items: [
      { label: "Pricing", href: "/admin/pricing", description: "Subscription plans and platform fees", icon: DollarSign },
      { label: "Subscribers", href: "/admin/subscribers", description: "Active and trial subscriptions", icon: UserCog },
      { label: "Revenue", href: "/admin/revenue", description: "MRR and revenue by stream", icon: TrendingUp },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { label: "Listings", href: "/admin/listings", description: "Livestock and product listings", icon: Tags },
      { label: "Orders", href: "/admin/orders", description: "Store orders and fulfillment status", icon: ShoppingCart },
      { label: "Sellers", href: "/admin/sellers", description: "Seller registration approvals", icon: Store },
      { label: "Customers", href: "/admin/customers", description: "Registered buyer accounts", icon: Users },
    ],
  },
  {
    label: "Logistics",
    items: [
      { label: "Partners", href: "/admin/logistics", description: "Logistics partner approvals", icon: Truck },
      { label: "Delivery Requests", href: "/admin/logistics/requests", description: "Delivery job board", icon: ClipboardList },
      { label: "Logistics Payouts", href: "/admin/logistics/payouts", description: "Settle partner earnings", icon: Wallet },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Seller Payouts", href: "/admin/payouts", description: "Track and settle seller balances", icon: Wallet },
      { label: "Expenses", href: "/admin/expenses", description: "Business costs and P&L", icon: Receipt },
      { label: "Reports", href: "/admin/reports", description: "Revenue, commission, seller analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Marketing",
    items: [
      { label: "Sponsors", href: "/admin/marketing", description: "Sponsorship applications", icon: Megaphone },
      { label: "Packages", href: "/admin/marketing/packages", description: "Sponsorship pricing tiers", icon: Megaphone },
      { label: "Quotes", href: "/admin/marketing/quotes", description: "Sponsor quotes", icon: Megaphone },
      { label: "Invoices", href: "/admin/marketing/invoices", description: "Sponsor invoices", icon: Megaphone },
      { label: "Creative", href: "/admin/marketing/creative", description: "Sponsor ad banners", icon: Megaphone },
      { label: "Ad Studio", href: "/admin/ad-studio", description: "Campaign builder, PNG export, performance", icon: Palette },
      { label: "Email & Push Slots", href: "/admin/marketing/email-slots", description: "Weekly sponsor slot bookings", icon: Megaphone },
    ],
  },
  {
    label: "Passive Revenue",
    items: [
      { label: "Finance Leads", href: "/admin/leads", description: "Finance & insurance referral leads", icon: HandCoins },
      { label: "Classifieds", href: "/admin/classifieds", description: "Equipment, jobs, grazing & wanted ads", icon: ListChecks },
      { label: "Services Directory", href: "/admin/directory", description: "Vets, shearers, contractors & more", icon: BookOpen },
      { label: "Digital Products", href: "/admin/digital-products", description: "Templates, guides, and downloads", icon: FileDown },
      { label: "Affiliates", href: "/admin/affiliates", description: "Affiliate links and click tracking", icon: Link2 },
    ],
  },
  {
    label: "Auctions",
    items: [
      { label: "Live Auctions", href: "/admin/auctions", description: "Auction sessions and lots", icon: Gavel },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Site Content", href: "/admin/content", description: "Homepage banner and categories", icon: FileEdit },
      { label: "Mobile App Content", href: "/admin/app-content", description: "Announcements, banners, push notifications", icon: Smartphone },
    ],
  },
  {
    label: "Settings",
    items: [
      { label: "Payment Settings", href: "/admin/settings/payments", description: "PayFast and commission rates", icon: CreditCard },
      { label: "Admin Users", href: "/admin/settings/admins", description: "Manage staff accounts and roles", icon: ShieldCheck },
    ],
  },
];

export const ADMIN_NAV_FLAT: AdminNavItem[] = ADMIN_NAV.flatMap((g) => g.items);
