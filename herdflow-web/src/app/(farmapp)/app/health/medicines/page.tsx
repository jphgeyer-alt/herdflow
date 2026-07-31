// WEBSITE — herdflow-web/src/app/(farmapp)/app/health/medicines/page.tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PlusCircle } from "lucide-react";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { listMedicines } from "@/lib/farm-health/queries";
import { Card, CardHeader } from "@/components/farm/Card";
import { MedicinesTable, type MedicineRow } from "./MedicinesTable";

export const dynamic = "force-dynamic";

export default async function MedicinesPage() {
  const t = await getTranslations("health");
  const user = await getFarmWebUser();
  if (!user) return null;

  const medicines = await listMedicines(user.effectiveFarmerId);
  const rows: MedicineRow[] = medicines.map((m) => ({
    id: m.id,
    name: m.name,
    category: m.category,
    quantityInStock: Number(m.quantityInStock),
    reorderLevel: m.reorderLevel != null ? Number(m.reorderLevel) : null,
    dosageUnit: m.dosageUnit,
  }));

  return (
    <div className="space-y-6 pb-10">
      <header className="flex items-center justify-between">
        <h1 className="text-navy-600 text-2xl font-semibold">{t("medicines_title")}</h1>
        <Link
          href="/app/health/medicines/new"
          className="flex items-center gap-2 rounded-lg bg-navy-600 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700"
        >
          <PlusCircle size={16} /> {t("add_medicine")}
        </Link>
      </header>

      <Card>
        <CardHeader title={t("medicines_title")} />
        <div className="p-4">
          <MedicinesTable medicines={rows} />
        </div>
      </Card>
    </div>
  );
}
