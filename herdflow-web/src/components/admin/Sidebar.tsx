"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { X } from "lucide-react";

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
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
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-600 text-sm font-black text-white">
              HF
            </div>
            <div>
              <p className="text-navy-600 text-sm font-bold leading-tight">HerdFlow</p>
              <p className="text-xs leading-tight text-navy-300">Admin</p>
            </div>
          </Link>
          <button
            className="rounded-lg p-1.5 text-navy-300 hover:bg-navy-25 lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
          {ADMIN_NAV.map((group) => (
            <div key={group.label}>
              <p className="px-2 pb-1.5 text-[10px] font-bold tracking-wider text-navy-200 uppercase">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "bg-navy-600 text-white"
                          : "text-navy-500 hover:bg-navy-25 hover:text-navy-600"
                      }`}
                    >
                      <Icon size={16} className={active ? "text-white" : "text-navy-300"} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
