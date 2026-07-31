// WEBSITE — herdflow-web/src/app/(farmapp)/app/health/page.tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PlusCircle } from "lucide-react";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { listHealthRecords } from "@/lib/farm-health/queries";
import { Card, CardHeader } from "@/components/farm/Card";
import { HealthHistoryTable, type HealthRecordRow } from "./HealthHistoryTable";

export const dynamic = "force-dynamic";

export default async function HealthHistoryPage() {
  const t = await getTranslations("health");
  const user = await getFarmWebUser();
  if (!user) return null;

  const records = await listHealthRecords(user.effectiveFarmerId);
  const rows: HealthRecordRow[] = records.map((r) => ({
    id: r.id,
    eventDate: r.eventDate.toISOString(),
    animalName: r.animalName,
    eventType: r.eventType,
    description: r.description,
    status: r.status,
    cost: r.cost != null ? Number(r.cost) : null,
  }));

  return (
    <div className="space-y-6 pb-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-navy-600 text-2xl font-semibold">{t("history_title")}</h1>
        </div>
        <Link
          href="/app/health/new"
          className="flex items-center gap-2 rounded-lg bg-navy-600 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700"
        >
          <PlusCircle size={16} /> {t("add_health_event")}
        </Link>
      </header>

      <Card>
        <CardHeader title={t("history_title")} />
        <div className="p-4">
          <HealthHistoryTable records={rows} />
        </div>
      </Card>
    </div>
  );
}
