"use client";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/profile/ProfileForm.tsx
import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Card } from "@/components/farm/Card";
import { useActionToast } from "@/components/farm/useActionToast";
import { saveFarmProfile, type SaveFarmProfileState } from "./actions";

const INPUT_CLASS = "w-full rounded-lg border border-navy-100 px-3 py-2 text-sm text-navy-600";
const initialState: SaveFarmProfileState = {};

export interface FarmProfileData {
  farmName: string;
  province: string;
  country: string;
  traceabilityGln: string | null;
  farmCode: string | null;
  mobileRole: string;
}

export function ProfileForm({ profile }: { profile: FarmProfileData }) {
  const t = useTranslations("profile");
  const [state, formAction, isPending] = useActionState(saveFarmProfile, initialState);
  useActionToast(state);

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
              {t("farm_name")}
            </label>
            <input type="text" name="farmName" defaultValue={profile.farmName} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
              {t("province")}
            </label>
            <input type="text" name="province" defaultValue={profile.province} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
              {t("country")}
            </label>
            <input type="text" name="country" defaultValue={profile.country} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
              {t("traceability_gln")}
            </label>
            <input
              type="text"
              name="traceabilityGln"
              defaultValue={profile.traceabilityGln ?? ""}
              className={INPUT_CLASS}
            />
          </div>
          {profile.farmCode && (
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
                {t("farm_code")}
              </label>
              <p className="rounded-lg border border-navy-100 bg-navy-25 px-3 py-2 text-sm text-navy-600">
                {profile.farmCode}
              </p>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-bold tracking-wider text-navy-300 uppercase">
              {t("your_role")}
            </label>
            <p className="rounded-lg border border-navy-100 bg-navy-25 px-3 py-2 text-sm text-navy-600">
              {profile.mobileRole}
            </p>
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-navy-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("save_profile")}
        </button>
        <Link href="/account/settings" className="text-sm font-semibold text-navy-500 hover:underline">
          {t("account_settings_link")}
        </Link>
      </div>
      <p className="text-xs text-navy-300">{t("account_settings_hint")}</p>
    </form>
  );
}
