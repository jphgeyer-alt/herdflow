import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminFromCookieStore } from "@/lib/admin-auth";

// This route group physically excludes /admin/login (a sibling of
// (protected), not nested inside it) — a more robust way to keep the login
// page unwrapped than trying to detect the current path inside a shared
// layout via a request header.
export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const jar = await cookies();
  const admin = await getAdminFromCookieStore(jar);

  // Middleware only checks cookie presence, not validity — an expired or
  // revoked session still needs to be caught here.
  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <AdminShell adminName={admin.fullName} adminRole={admin.role}>
      {children}
    </AdminShell>
  );
}
