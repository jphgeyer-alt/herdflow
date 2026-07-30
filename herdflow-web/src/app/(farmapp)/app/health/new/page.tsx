// WEBSITE — herdflow-web/src/app/(farmapp)/app/health/new/page.tsx
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { listAnimalsForSelect } from "@/lib/farm-health/queries";
import { AddHealthEventForm } from "./AddHealthEventForm";

export const dynamic = "force-dynamic";

export default async function NewHealthEventPage() {
  const t = await getTranslations("health");
  const user = await getFarmWebUser();
  if (!user) return null;

  const animals = await listAnimalsForSelect(user.effectiveFarmerId);

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <header>
        <h1 className="text-navy-600 text-2xl font-semibold">{t("add_health_event")}</h1>
      </header>
      <AddHealthEventForm
        animals={animals.map((a) => ({ id: a.id, label: a.name || a.tagNumber || a.id }))}
      />
    </div>
  );
}
