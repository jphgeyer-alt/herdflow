"use client";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/health/new/AddHealthEventForm.tsx
import { useActionState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/farm/Card";
import { useActionToast } from "@/components/farm/useActionToast";
import { addHealthEvent, type AddHealthEventState } from "./actions";

const EVENT_TYPES = ["illness", "injury", "treatment", "vaccine", "checkup", "other"] as const;
const SEVERITIES = ["low", "medium", "high"] as const;
const INPUT_CLASS = "w-full rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-600";

const initialState: AddHealthEventState = {};

export interface AnimalOption {
  id: string;
  label: string;
}

export function AddHealthEventForm({ animals }: { animals: AnimalOption[] }) {
  const t = useTranslations("health");
  const [state, formAction, isPending] = useActionState(addHealthEvent, initialState);
  useActionToast(state);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--status-danger-text)]/20 bg-[var(--status-danger-bg)] px-4 py-3 text-sm text-[var(--status-danger-text)]">
          <AlertCircle size={16} />
          {state.error}
        </div>
      )}

      <Card className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
              {t("animal")} *
            </label>
            <select name="animalId" required className={INPUT_CLASS}>
              <option value="">{t("select_animal")}</option>
              {animals.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
              {t("event_type")} *
            </label>
            <select name="eventType" required className={INPUT_CLASS}>
              <option value="">{t("select_event_type")}</option>
              {EVENT_TYPES.map((e) => (
                <option key={e} value={e}>
                  {t(`event_type_${e}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
              {t("event_date")}
            </label>
            <input type="date" name="eventDate" defaultValue={today} max={today} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
              {t("severity")}
            </label>
            <select name="severity" className={INPUT_CLASS}>
              <option value="">—</option>
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {t(`severity_${s}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
              {t("vet_name")}
            </label>
            <input type="text" name="vetName" className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
              {t("cost")}
            </label>
            <input type="number" step="0.01" min="0" name="cost" className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
              {t("follow_up_date")}
            </label>
            <input type="date" name="followUpDate" className={INPUT_CLASS} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            {t("description")}
          </label>
          <textarea name="description" rows={2} className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            {t("diagnosis")}
          </label>
          <textarea name="diagnosis" rows={2} className={INPUT_CLASS} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
            {t("treatment")}
          </label>
          <textarea name="treatment" rows={2} className={INPUT_CLASS} />
        </div>
      </Card>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-navy-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t("save_event")}
      </button>
    </form>
  );
}
