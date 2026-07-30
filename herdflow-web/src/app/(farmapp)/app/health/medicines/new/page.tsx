// WEBSITE — herdflow-web/src/app/(farmapp)/app/health/medicines/new/page.tsx
import { getTranslations } from "next-intl/server";
import { AddMedicineForm } from "./AddMedicineForm";

export const dynamic = "force-dynamic";

export default async function NewMedicinePage() {
  const t = await getTranslations("health");

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <header>
        <h1 className="text-navy-600 text-2xl font-semibold">{t("add_medicine")}</h1>
      </header>
      <AddMedicineForm />
    </div>
  );
}
