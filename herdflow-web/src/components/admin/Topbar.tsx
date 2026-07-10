"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, ChevronDown, LogOut, KeyRound, ChevronRight } from "lucide-react";
import { ADMIN_NAV_FLAT } from "@/lib/admin-nav";
import { RoleBadge } from "./Badge";

function currentPageLabel(pathname: string) {
  const exact = ADMIN_NAV_FLAT.find((i) => i.href === pathname);
  if (exact) return exact.label;
  const prefixMatch = [...ADMIN_NAV_FLAT]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => pathname.startsWith(`${i.href}/`));
  return prefixMatch?.label ?? "Admin";
}

export function Topbar({
  adminName,
  adminRole,
  onMenuClick,
}: {
  adminName: string;
  adminRole: string;
  onMenuClick: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
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
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const initials = adminName
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
          aria-label="Open menu"
          type="button"
        >
          <Menu size={20} />
        </button>
        <nav className="flex items-center gap-1.5 text-sm text-navy-300">
          <Link href="/admin" className="hover:text-navy-600">
            Admin
          </Link>
          {pathname !== "/admin" && (
            <>
              <ChevronRight size={14} />
              <span className="font-semibold text-navy-600">{currentPageLabel(pathname)}</span>
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
            {initials || "A"}
          </div>
          <span className="hidden text-sm font-semibold text-navy-600 sm:inline">{adminName}</span>
          <ChevronDown size={14} className="text-navy-300" />
        </button>

        {open && (
          <div className="absolute right-0 z-40 mt-2 w-56 rounded-lg border border-navy-50 bg-white py-1 shadow-lg">
            <div className="border-b border-navy-50 px-3 py-2">
              <p className="text-sm font-semibold text-navy-600">{adminName}</p>
              <div className="mt-1">
                <RoleBadge role={adminRole} />
              </div>
            </div>
            <Link
              href="/admin/settings/admins?me=1"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-navy-500 hover:bg-navy-25"
            >
              <KeyRound size={14} /> Change password
            </Link>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              onClick={handleLogout}
              type="button"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
