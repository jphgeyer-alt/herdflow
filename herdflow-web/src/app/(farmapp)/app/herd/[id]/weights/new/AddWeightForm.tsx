"use client";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/herd/[id]/weights/new/AddWeightForm.tsx
import { useActionState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/farm/Card";
import { useActionToast } from "@/components/farm/useActionToast";
import { addWeight, type AddWeightState } from "./actions";

const INPUT_CLASS = "w-full rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-600";

const initialState: AddWeightState = {};

export function AddWeightForm({ animalId }: { animalId: string }) {
  const t = useTranslations("herd");
  const [state, formAction, isPending] = useActionState(addWeight, initialState);
  useActionToast(state);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="animalId" value={animalId} />
      {state.error && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--status-danger-text)]/20 bg-[var(--status-danger-bg)] px-4 py-3 text-sm text-[var(--status-danger-text)]">
          <AlertCircle size={16} />
          {state.error}
        </div>
      )}

      <Card className="space-y-4 p-5">
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            {t("weight")} *
          </label>
          <input type="number" step="0.1" min="0" name="weight" required className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            {t("recorded_date")}
          </label>
          <input type="date" name="recordedDate" defaultValue={today} max={today} className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            {t("body_condition_score")}
          </label>
          <input type="number" step="1" min="1" max="9" name="bodyConditionScore" className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            {t("notes")}
          </label>
          <textarea name="notes" rows={3} className={INPUT_CLASS} />
        </div>
      </Card>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-navy-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t("save_weight")}
      </button>
    </form>
  );
}
