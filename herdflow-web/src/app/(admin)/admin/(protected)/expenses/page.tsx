import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminFromCookieStore } from "@/lib/admin-auth";
import { ExpensesClient } from "./expenses-client";

export const dynamic = "force-dynamic";

export default async function AdminExpensesPage() {
  const jar = await cookies();
  const me = await getAdminFromCookieStore(jar);
  if (!me) redirect("/admin/login");

  return <ExpensesClient me={me} />;
}
