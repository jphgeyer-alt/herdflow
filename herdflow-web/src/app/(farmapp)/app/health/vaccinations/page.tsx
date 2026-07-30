// WEBSITE — herdflow-web/src/app/(farmapp)/app/health/vaccinations/page.tsx
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { listVaccinationsBucketed } from "@/lib/farm-health/queries";
import { formatDate } from "@/lib/farm-finance/format";
import { Card, CardHeader } from "@/components/farm/Card";

export const dynamic = "force-dynamic";

type VaccinationRow = Awaited<ReturnType<typeof listVaccinationsBucketed>>["overdue"][number];

function Bucket({
  title,
  rows,
  emptyLabel,
  tone,
}: {
  title: string;
  rows: VaccinationRow[];
  emptyLabel: string;
  tone?: "danger" | "warning";
}) {
  return (
    <Card>
      <CardHeader title={title} />
      {rows.length === 0 ? (
        <p className="p-6 text-center text-sm text-navy-300">{emptyLabel}</p>
      ) : (
        <div className="divide-y divide-navy-50">
          {rows.map((v) => (
            <div key={v.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-navy-600">{v.vaccineName}</p>
                <p className="truncate text-xs text-navy-300">{v.animalName}</p>
              </div>
              <p
                className={`shrink-0 text-xs font-semibold ${
                  tone === "danger"
                    ? "text-[var(--status-danger-text)]"
                    : tone === "warning"
                      ? "text-[var(--status-warning-text)]"
                      : "text-navy-300"
                }`}
              >
                {v.nextDueDate ? formatDate(v.nextDueDate) : "—"}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default async function VaccinationSchedulePage() {
  const t = await getTranslations("health");
  const user = await getFarmWebUser();
  if (!user) return null;

  const buckets = await listVaccinationsBucketed(user.effectiveFarmerId);
  const emptyLabel = t("no_vaccinations_in_bucket");

  return (
    <div className="space-y-6 pb-10">
      <header>
        <h1 className="text-navy-600 text-2xl font-semibold">{t("vaccinations_title")}</h1>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Bucket title={t("overdue")} rows={buckets.overdue} emptyLabel={emptyLabel} tone="danger" />
        <Bucket title={t("this_week")} rows={buckets.thisWeek} emptyLabel={emptyLabel} tone="warning" />
        <Bucket title={t("upcoming")} rows={buckets.upcoming} emptyLabel={emptyLabel} />
        <Bucket title={t("completed")} rows={buckets.completed} emptyLabel={emptyLabel} />
      </div>
    </div>
  );
}
