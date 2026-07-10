import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAdminFromCookieStore } from "@/lib/admin-auth";
import { AdminsManager } from "./admins-manager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const jar = await cookies();
  const me = await getAdminFromCookieStore(jar);
  if (!me) redirect("/admin/login");

  const admins = await prisma.adminUser
    .findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })
    .catch(() => []);

  return (
    <main className="space-y-5 pb-10">
      <header>
        <h1 className="text-navy-600 text-3xl font-semibold">Admin Users</h1>
        <p className="text-sm text-navy-300">
          Manage staff accounts, roles, and your own login credentials.
        </p>
      </header>

      <AdminsManager initialAdmins={admins} me={me} />
    </main>
  );
}
