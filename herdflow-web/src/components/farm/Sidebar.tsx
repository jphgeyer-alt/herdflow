"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { FARM_FINANCE_NAV } from "@/lib/farm-nav";

function isActive(pathname: string, href: string) {
  if (href === "/app/finance") return pathname === "/app/finance";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  open,
  onClose,
  farmName,
}: {
  open: boolean;
  onClose: () => void;
  farmName: string;
}) {
  const pathname = usePathname();
  const t = useTranslations("finance");

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-navy-900/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-navy-50 bg-white transition-transform lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/app/finance" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-600 text-sm font-black text-white">
              HF
            </div>
            <div className="min-w-0">
              <p className="text-navy-600 text-sm font-bold leading-tight">{t("farm_financials")}</p>
              <p className="truncate text-xs leading-tight text-navy-300">{farmName || "HerdFlow"}</p>
            </div>
          </Link>
          <button
            className="rounded-lg p-1.5 text-navy-300 hover:bg-navy-25 lg:hidden"
            onClick={onClose}
            aria-label={t("close_menu")}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-6">
          {FARM_FINANCE_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-navy-600 text-white"
                    : "text-navy-500 hover:bg-navy-25 hover:text-navy-600"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={16} className={active ? "text-white" : "text-navy-300"} />
                  {t(item.labelKey)}
                </span>
                {item.shortcut && (
                  <kbd
                    className={`hidden rounded border px-1.5 py-0.5 text-[10px] font-semibold lg:inline-block ${
                      active
                        ? "border-white/30 text-white/70"
                        : "border-navy-100 text-navy-200"
                    }`}
                  >
                    {item.shortcut}
                  </kbd>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-navy-50 px-5 py-4">
          <Link href="/" className="text-xs font-medium text-navy-300 hover:text-navy-600">
            {t("back_to_herdflow")}
          </Link>
        </div>
      </aside>
    </>
  );
}
