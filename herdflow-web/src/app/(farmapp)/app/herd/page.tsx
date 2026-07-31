// WEBSITE — herdflow-web/src/app/(farmapp)/app/herd/page.tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PlusCircle } from "lucide-react";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { listAnimals } from "@/lib/farm-herd/queries";
import { Card, CardHeader, StatCard } from "@/components/farm/Card";
import { HerdListTable, type AnimalRow } from "./HerdListTable";

export const dynamic = "force-dynamic";

export default async function HerdPage() {
  const t = await getTranslations("herd");
  const user = await getFarmWebUser();
  if (!user) return null;

  const animals = await listAnimals(user.effectiveFarmerId);

  const rows: AnimalRow[] = animals.map((a) => ({
    id: a.id,
    name: a.name,
    tagNumber: a.tagNumber,
    species: a.species,
    breed: a.breed,
    gender: a.gender,
    status: a.status,
    healthStatus: a.healthStatus,
    weight: a.weight != null ? Number(a.weight) : null,
  }));

  // Case-insensitive: the mobile app writes "Active"/"Sick" (mixed case)
  // for most rows, not the Prisma schema's uppercase default -- a strict
  // match here silently undercounted almost every real animal.
  const activeCount = rows.filter((a) => a.status.toUpperCase() === "ACTIVE").length;
  const sickCount = rows.filter((a) => a.healthStatus.toUpperCase() === "SICK").length;

  return (
    <div className="space-y-6 pb-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-navy-600 text-2xl font-semibold">{t("herd_title")}</h1>
          <p className="text-sm text-navy-300">
            {t(rows.length === 1 ? "animal_count_one" : "animal_count_other", { count: rows.length })}
          </p>
        </div>
        <Link
          href="/app/herd/new"
          className="flex items-center gap-2 rounded-lg bg-navy-600 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700"
        >
          <PlusCircle size={16} /> {t("add_animal")}
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label={t("active_count")} value={activeCount} tone="success" />
        <StatCard label={t("sick_count")} value={sickCount} tone={sickCount > 0 ? "danger" : "navy"} />
      </div>

      <Card>
        <CardHeader title={t("herd_title")} />
        <div className="p-4">
          <HerdListTable animals={rows} />
        </div>
      </Card>
    </div>
  );
}
