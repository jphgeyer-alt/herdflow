// WEBSITE — herdflow-web/src/app/(farmapp)/app/profile/page.tsx
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { getFarmProfile } from "@/lib/farm-profile/queries";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function FarmProfilePage() {
  const t = await getTranslations("profile");
  const user = await getFarmWebUser();
  if (!user) return null;

  const profile = await getFarmProfile(user.id);
  if (!profile) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <header>
        <h1 className="text-navy-600 text-2xl font-semibold">{t("farm_profile_title")}</h1>
      </header>
      <ProfileForm
        profile={{
          farmName: profile.farmName,
          province: profile.province,
          country: profile.country,
          traceabilityGln: profile.traceabilityGln,
          farmCode: profile.farmCode,
          mobileRole: profile.mobileRole,
        }}
      />
    </div>
  );
}
