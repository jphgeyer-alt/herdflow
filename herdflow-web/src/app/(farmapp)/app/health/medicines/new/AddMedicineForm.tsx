"use client";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/health/medicines/new/AddMedicineForm.tsx
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/farm/Card";
import { addMedicine, type AddMedicineState } from "./actions";

const INPUT_CLASS = "w-full rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-600";
const initialState: AddMedicineState = {};

export function AddMedicineForm() {
  const t = useTranslations("health");
  const [state, formAction, isPending] = useActionState(addMedicine, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--status-danger-text)]/20 bg-[var(--status-danger-bg)] px-4 py-3 text-sm text-[var(--status-danger-text)]">
          <AlertCircle size={16} />
          {state.error}
        </div>
      )}

      <Card className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            {t("medicine_name")} *
          </label>
          <input type="text" name="name" required className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            {t("category")} *
          </label>
          <input type="text" name="category" required className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            {t("manufacturer")}
          </label>
          <input type="text" name="manufacturer" className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            {t("dosage_unit")}
          </label>
          <input type="text" name="dosageUnit" className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            {t("quantity_in_stock")}
          </label>
          <input type="number" step="0.01" min="0" name="quantityInStock" className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            {t("reorder_level")}
          </label>
          <input type="number" step="0.01" min="0" name="reorderLevel" className={INPUT_CLASS} />
        </div>
      </Card>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-navy-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t("save_medicine")}
      </button>
    </form>
  );
}
