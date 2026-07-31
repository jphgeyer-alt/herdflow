// WEBSITE — herdflow-web/src/app/(farmapp)/app/herd/[id]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Pencil, Weight as WeightIcon } from "lucide-react";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { getAnimalDetail } from "@/lib/farm-herd/queries";
import { formatDate, formatWeight } from "@/lib/farm-finance/format";
import { Card, CardHeader, Badge } from "@/components/farm/Card";

export const dynamic = "force-dynamic";

const KNOWN_EVENT_TYPES = new Set(["illness", "injury", "treatment", "vaccine", "checkup", "other"]);

function healthEventLabel(t: Awaited<ReturnType<typeof getTranslations>>, eventType: string): string {
  const key = eventType.toLowerCase();
  return KNOWN_EVENT_TYPES.has(key) ? t(`event_type_${key}`) : eventType;
}

export default async function AnimalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getTranslations("herd");
  const th = await getTranslations("health");
  const user = await getFarmWebUser();
  if (!user) return null;

  const { id } = await params;
  const detail = await getAnimalDetail(user.effectiveFarmerId, id);
  if (!detail) notFound();

  const { animal, health, weights } = detail;

  return (
    <div className="space-y-6 pb-10">
      <Link href="/app/herd" className="flex items-center gap-1 text-sm font-semibold text-navy-500 hover:text-navy-600">
        <ArrowLeft size={14} /> {t("back_to_herd")}
      </Link>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-navy-600 text-2xl font-semibold">{animal.name || animal.tagNumber || t("animal_details")}</h1>
          <p className="text-sm text-navy-300">{animal.tagNumber ? `${t("tag")}: ${animal.tagNumber}` : ""}</p>
        </div>
        <Link
          href={`/app/herd/${animal.id}/edit`}
          className="flex items-center gap-2 rounded-lg border border-navy-100 px-4 py-2 text-sm font-semibold text-navy-600 hover:bg-navy-25"
        >
          <Pencil size={16} /> {t("edit_animal")}
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title={t("animal_details")} />
          <dl className="divide-y divide-navy-50 p-4 text-sm">
            <Row label={t("species")} value={animal.species} />
            <Row label={t("breed")} value={animal.breed || "—"} />
            <Row label={t("gender")} value={animal.gender || "—"} />
            <Row label={t("date_of_birth")} value={formatDate(animal.dateOfBirth)} />
            <Row label={t("weight")} value={formatWeight(animal.weight != null ? Number(animal.weight) : null)} />
            <Row label={t("colour")} value={animal.colour || "—"} />
            <Row label={t("camp")} value={animal.camp || "—"} />
            <Row
              label={t("health_status")}
              value={<Badge variant={animal.healthStatus.toUpperCase() === "HEALTHY" ? "success" : "danger"}>{animal.healthStatus}</Badge>}
            />
            <Row label={t("status")} value={<Badge variant={animal.status.toUpperCase() === "ACTIVE" ? "success" : "neutral"}>{animal.status}</Badge>} />
            {animal.notes && <Row label={t("notes")} value={animal.notes} />}
          </dl>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title={t("weight_history")}
            action={
              <Link
                href={`/app/herd/${animal.id}/weights/new`}
                className="flex items-center gap-2 rounded-lg bg-navy-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-navy-700"
              >
                <WeightIcon size={14} /> {t("add_weight")}
              </Link>
            }
          />
          {weights.length === 0 ? (
            <p className="p-6 text-center text-sm text-navy-300">{t("no_weight_records")}</p>
          ) : (
            <div className="divide-y divide-navy-50">
              {weights.map((w) => (
                <div key={w.id} className="flex items-center justify-between px-4 py-3">
                  <p className="text-sm text-navy-500">{formatDate(w.recordedDate)}</p>
                  <p className="text-sm font-semibold text-navy-600">{formatWeight(Number(w.weight))}</p>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title={t("health_history")} />
          {health.length === 0 ? (
            <p className="p-6 text-center text-sm text-navy-300">{t("no_health_records")}</p>
          ) : (
            <div className="divide-y divide-navy-50">
              {health.map((h) => (
                <div key={h.id} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-navy-600">
                      {healthEventLabel(th, h.eventType)}
                    </p>
                    {h.description && <p className="truncate text-xs text-navy-300">{h.description}</p>}
                  </div>
                  <p className="shrink-0 text-xs text-navy-300">{formatDate(h.eventDate)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="text-navy-300">{label}</dt>
      <dd className="font-medium text-navy-600">{value}</dd>
    </div>
  );
}
