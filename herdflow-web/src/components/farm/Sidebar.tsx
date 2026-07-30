"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { FARM_SECTIONS, type FarmSectionKey } from "@/lib/farm-nav";

function isActive(pathname: string, href: string, homeHref: string) {
  if (href === homeHref) return pathname === homeHref;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  open,
  onClose,
  farmName,
  section = "finance",
}: {
  open: boolean;
  onClose: () => void;
  farmName: string;
  section?: FarmSectionKey;
}) {
  const pathname = usePathname();
  const { navItems, namespace, homeHref, sectionLabelKey } = FARM_SECTIONS[section];
  const t = useTranslations(namespace);

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
        className={`fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col bg-[var(--sidebar-bg)] transition-transform lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link href={homeHref} className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--sidebar-active-border)] text-sm font-black text-[var(--sidebar-bg)]">
              HF
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight text-[var(--sidebar-text)]">{t(sectionLabelKey)}</p>
              <p className="truncate text-xs leading-tight text-[var(--sidebar-text-muted)]">{farmName || "HerdFlow"}</p>
            </div>
          </Link>
          <button
            className="rounded-lg p-1.5 text-[var(--sidebar-text-muted)] hover:bg-white/5 lg:hidden"
            onClick={onClose}
            aria-label={t("close_menu")}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-6">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href, homeHref);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between gap-2.5 rounded-lg border-l-[3px] px-2.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-[var(--sidebar-active-border)] bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] font-semibold"
                    : "border-transparent text-[var(--sidebar-text-muted)] hover:bg-white/5 hover:text-[var(--sidebar-text)]"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={16} className={active ? "text-[var(--sidebar-active-text)]" : "text-[var(--sidebar-text-muted)]"} />
                  {t(item.labelKey)}
                </span>
                {item.shortcut && (
                  <kbd
                    className={`hidden rounded border px-1.5 py-0.5 text-[10px] font-semibold lg:inline-block ${
                      active
                        ? "border-[var(--sidebar-active-text)]/30 text-[var(--sidebar-active-text)]/70"
                        : "border-white/10 text-[var(--sidebar-text-muted)]"
                    }`}
                  >
                    {item.shortcut}
                  </kbd>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <Link href="/" className="text-xs font-medium text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)]">
            {t("back_to_herdflow")}
          </Link>
        </div>
      </aside>
    </>
  );
}
