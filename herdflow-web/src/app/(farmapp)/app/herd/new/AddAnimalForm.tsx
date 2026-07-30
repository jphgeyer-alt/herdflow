"use client";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/herd/new/AddAnimalForm.tsx
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/farm/Card";
import { addAnimal, type AddAnimalState } from "./actions";

const SPECIES = ["cattle", "sheep", "goat", "pig", "poultry", "other"] as const;

const INPUT_CLASS = "w-full rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-600";

const initialState: AddAnimalState = {};

export function AddAnimalForm() {
  const t = useTranslations("herd");
  const [state, formAction, isPending] = useActionState(addAnimal, initialState);

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
          <Field label={t("species")} required>
            <select name="species" required className={INPUT_CLASS}>
              <option value="">{t("select_species")}</option>
              {SPECIES.map((s) => (
                <option key={s} value={s}>
                  {t(`species_${s}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("name")}>
            <input type="text" name="name" className={INPUT_CLASS} />
          </Field>
          <Field label={t("tag")}>
            <input type="text" name="tagNumber" className={INPUT_CLASS} />
          </Field>
          <Field label={t("breed")}>
            <input type="text" name="breed" className={INPUT_CLASS} />
          </Field>
          <Field label={t("gender")}>
            <select name="gender" className={INPUT_CLASS}>
              <option value="">—</option>
              <option value="MALE">{t("gender_male")}</option>
              <option value="FEMALE">{t("gender_female")}</option>
            </select>
          </Field>
          <Field label={t("date_of_birth")}>
            <input type="date" name="dateOfBirth" className={INPUT_CLASS} />
          </Field>
          <Field label={t("weight")}>
            <input type="number" step="0.1" min="0" name="weight" className={INPUT_CLASS} />
          </Field>
          <Field label={t("colour")}>
            <input type="text" name="colour" className={INPUT_CLASS} />
          </Field>
          <Field label={t("camp")}>
            <input type="text" name="camp" className={INPUT_CLASS} />
          </Field>
          <Field label={t("source")}>
            <input type="text" name="source" className={INPUT_CLASS} />
          </Field>
          <Field label={t("date_acquired")}>
            <input type="date" name="dateAcquired" className={INPUT_CLASS} />
          </Field>
          <Field label={t("purchase_price")}>
            <input type="number" step="0.01" min="0" name="purchasePrice" className={INPUT_CLASS} />
          </Field>
        </div>
        <Field label={t("notes")}>
          <textarea name="notes" rows={3} className={INPUT_CLASS} />
        </Field>
      </Card>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-navy-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("save_animal")}
        </button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
        {label}
        {required && " *"}
      </label>
      {children}
    </div>
  );
}
