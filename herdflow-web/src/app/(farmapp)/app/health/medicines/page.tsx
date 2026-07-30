// WEBSITE — herdflow-web/src/app/(farmapp)/app/health/medicines/page.tsx
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PlusCircle } from "lucide-react";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { listMedicines } from "@/lib/farm-health/queries";
import { Card, CardHeader, Badge } from "@/components/farm/Card";

export const dynamic = "force-dynamic";

export default async function MedicinesPage() {
  const t = await getTranslations("health");
  const user = await getFarmWebUser();
  if (!user) return null;

  const medicines = await listMedicines(user.effectiveFarmerId);

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
        {medicines.length === 0 ? (
          <p className="p-6 text-center text-sm text-navy-300">{t("no_medicines_yet")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-50 text-xs font-semibold tracking-wide text-navy-300 uppercase">
                  <th className="px-4 py-2 text-left">{t("medicine_name")}</th>
                  <th className="px-4 py-2 text-left">{t("category")}</th>
                  <th className="px-4 py-2 text-right">{t("quantity_in_stock")}</th>
                  <th className="px-4 py-2 text-left">{t("dosage_unit")}</th>
                  <th className="px-4 py-2 text-left">{t("status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {medicines.map((m) => {
                  const qty = Number(m.quantityInStock);
                  const reorder = m.reorderLevel != null ? Number(m.reorderLevel) : null;
                  const isLow = reorder != null && qty <= reorder;
                  return (
                    <tr key={m.id} className="hover:bg-navy-25">
                      <td className="px-4 py-2.5 font-medium text-navy-600">{m.name}</td>
                      <td className="px-4 py-2.5 text-navy-500">{m.category}</td>
                      <td className="px-4 py-2.5 text-right text-navy-500">{qty}</td>
                      <td className="px-4 py-2.5 text-navy-500">{m.dosageUnit || "—"}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={isLow ? "danger" : "success"}>{isLow ? t("low_stock") : t("in_stock")}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
