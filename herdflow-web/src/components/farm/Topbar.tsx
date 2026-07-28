"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Menu, ChevronDown, LogOut, ChevronRight } from "lucide-react";
import { FARM_FINANCE_NAV, type FarmNavItem } from "@/lib/farm-nav";
import { Badge } from "./Card";

function currentPageLabelKey(pathname: string, navItems: FarmNavItem[], fallback: string) {
  const exact = navItems.find((i) => i.href === pathname);
  if (exact) return exact.labelKey;
  const prefixMatch = [...navItems]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => pathname.startsWith(`${i.href}/`));
  return prefixMatch?.labelKey ?? fallback;
}

const ROLE_LABEL_KEY: Record<string, string> = {
  FARMER: "role_farm_owner",
  FARM_MANAGER: "role_farm_manager",
  FARM_WORKER: "role_farm_worker",
};

export function Topbar({
  fullName,
  mobileRole,
  onMenuClick,
  navItems = FARM_FINANCE_NAV,
  namespace = "finance",
  homeHref = "/app/finance",
  sectionLabelKey = "farm_financials",
  fallbackLabelKey = "nav_dashboard",
}: {
  fullName: string;
  mobileRole: string;
  onMenuClick: () => void;
  navItems?: FarmNavItem[];
  namespace?: string;
  homeHref?: string;
  sectionLabelKey?: string;
  fallbackLabelKey?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations(namespace);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
    router.refresh();
  }

  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-navy-50 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          className="rounded-lg p-1.5 text-navy-500 hover:bg-navy-25 lg:hidden"
          onClick={onMenuClick}
          aria-label={t("open_menu")}
          type="button"
        >
          <Menu size={20} />
        </button>
        <nav className="flex items-center gap-1.5 text-sm text-navy-300">
          <span>{t(sectionLabelKey)}</span>
          {pathname !== homeHref && (
            <>
              <ChevronRight size={14} />
              <span className="font-semibold text-navy-600">
                {t(currentPageLabelKey(pathname, navItems, fallbackLabelKey))}
              </span>
            </>
          )}
        </nav>
      </div>

      <div className="relative" ref={ref}>
        <button
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-navy-25"
          onClick={() => setOpen((v) => !v)}
          type="button"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-600 text-xs font-bold text-white">
            {initials || "F"}
          </div>
          <span className="hidden text-sm font-semibold text-navy-600 sm:inline">{fullName}</span>
          <ChevronDown size={14} className="text-navy-300" />
        </button>

        {open && (
          <div className="absolute right-0 z-40 mt-2 w-56 rounded-lg border border-navy-50 bg-white py-1 shadow-lg">
            <div className="border-b border-navy-50 px-3 py-2">
              <p className="text-sm font-semibold text-navy-600">{fullName}</p>
              <div className="mt-1">
                <Badge variant="info">{ROLE_LABEL_KEY[mobileRole] ? t(ROLE_LABEL_KEY[mobileRole]) : mobileRole}</Badge>
              </div>
            </div>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--status-danger-text)] hover:bg-navy-25"
              onClick={handleLogout}
              type="button"
            >
              <LogOut size={14} /> {t("log_out")}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
