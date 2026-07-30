"use client";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/herd/[id]/edit/EditAnimalForm.tsx
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/farm/Card";
import { editAnimal, type EditAnimalState } from "./actions";

const SPECIES = ["cattle", "sheep", "goat", "pig", "poultry", "other"] as const;
const INPUT_CLASS = "w-full rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-600";

const initialState: EditAnimalState = {};

export interface EditableAnimal {
  id: string;
  name: string | null;
  species: string;
  breed: string | null;
  gender: string | null;
  tagNumber: string | null;
  dateOfBirth: string | null;
  weight: number | null;
  colour: string | null;
  camp: string | null;
  notes: string | null;
}

export function EditAnimalForm({ animal }: { animal: EditableAnimal }) {
  const t = useTranslations("herd");
  const [state, formAction, isPending] = useActionState(editAnimal, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={animal.id} />
      {state.error && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--status-danger-text)]/20 bg-[var(--status-danger-bg)] px-4 py-3 text-sm text-[var(--status-danger-text)]">
          <AlertCircle size={16} />
          {state.error}
        </div>
      )}

      <Card className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("species")} required>
            <select name="species" required defaultValue={animal.species} className={INPUT_CLASS}>
              {SPECIES.map((s) => (
                <option key={s} value={s}>
                  {t(`species_${s}`)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t("name")}>
            <input type="text" name="name" defaultValue={animal.name ?? ""} className={INPUT_CLASS} />
          </Field>
          <Field label={t("tag")}>
            <input type="text" name="tagNumber" defaultValue={animal.tagNumber ?? ""} className={INPUT_CLASS} />
          </Field>
          <Field label={t("breed")}>
            <input type="text" name="breed" defaultValue={animal.breed ?? ""} className={INPUT_CLASS} />
          </Field>
          <Field label={t("gender")}>
            <select name="gender" defaultValue={animal.gender ?? ""} className={INPUT_CLASS}>
              <option value="">—</option>
              <option value="MALE">{t("gender_male")}</option>
              <option value="FEMALE">{t("gender_female")}</option>
            </select>
          </Field>
          <Field label={t("date_of_birth")}>
            <input type="date" name="dateOfBirth" defaultValue={animal.dateOfBirth ?? ""} className={INPUT_CLASS} />
          </Field>
          <Field label={t("weight")}>
            <input type="number" step="0.1" min="0" name="weight" defaultValue={animal.weight ?? ""} className={INPUT_CLASS} />
          </Field>
          <Field label={t("colour")}>
            <input type="text" name="colour" defaultValue={animal.colour ?? ""} className={INPUT_CLASS} />
          </Field>
          <Field label={t("camp")}>
            <input type="text" name="camp" defaultValue={animal.camp ?? ""} className={INPUT_CLASS} />
          </Field>
        </div>
        <Field label={t("notes")}>
          <textarea name="notes" rows={3} defaultValue={animal.notes ?? ""} className={INPUT_CLASS} />
        </Field>
      </Card>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-navy-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("save_changes")}
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
