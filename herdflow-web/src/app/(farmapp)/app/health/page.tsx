// WEBSITE — herdflow-web/src/app/(farmapp)/app/health/page.tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PlusCircle } from "lucide-react";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { listHealthRecords } from "@/lib/farm-health/queries";
import { formatDate, formatCurrency } from "@/lib/farm-finance/format";
import { Card, CardHeader, Badge } from "@/components/farm/Card";

export const dynamic = "force-dynamic";

const KNOWN_EVENT_TYPES = new Set(["illness", "injury", "treatment", "vaccine", "checkup", "other"]);

export default async function HealthHistoryPage() {
  const t = await getTranslations("health");
  const user = await getFarmWebUser();
  if (!user) return null;

  const records = await listHealthRecords(user.effectiveFarmerId);

  function eventLabel(eventType: string) {
    const key = eventType.toLowerCase();
    return KNOWN_EVENT_TYPES.has(key) ? t(`event_type_${key}`) : eventType;
  }

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
        {records.length === 0 ? (
          <p className="p-6 text-center text-sm text-navy-300">{t("no_health_records_yet")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-50 text-xs font-semibold tracking-wide text-navy-300 uppercase">
                  <th className="px-4 py-2 text-left">{t("event_date")}</th>
                  <th className="px-4 py-2 text-left">{t("animal")}</th>
                  <th className="px-4 py-2 text-left">{t("event_type")}</th>
                  <th className="px-4 py-2 text-left">{t("description")}</th>
                  <th className="px-4 py-2 text-left">{t("status")}</th>
                  <th className="px-4 py-2 text-right">{t("cost")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-navy-25">
                    <td className="px-4 py-2.5 whitespace-nowrap text-navy-500">{formatDate(r.eventDate)}</td>
                    <td className="px-4 py-2.5 text-navy-600">{r.animalName}</td>
                    <td className="px-4 py-2.5 text-navy-500">{eventLabel(r.eventType)}</td>
                    <td className="px-4 py-2.5 text-navy-500">{r.description || "—"}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant={r.status === "resolved" ? "success" : "warning"}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right text-navy-500">
                      {r.cost != null ? formatCurrency(Number(r.cost)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
