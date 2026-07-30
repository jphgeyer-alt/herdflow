"use server";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/profile/actions.ts
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { updateFarmProfile } from "@/lib/farm-profile/queries";

export interface SaveFarmProfileState {
  error?: string;
  success?: boolean;
}

export async function saveFarmProfile(
  _prev: SaveFarmProfileState,
  formData: FormData,
): Promise<SaveFarmProfileState> {
  const t = await getTranslations("profile");
  const user = await getFarmWebUser();
  if (!user) redirect("/auth/login?redirect=/app/profile");

  const farmName = String(formData.get("farmName") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  const traceabilityGln = String(formData.get("traceabilityGln") ?? "").trim();

  try {
    await updateFarmProfile(user.id, {
      farmName,
      province,
      country,
      traceabilityGln: traceabilityGln || null,
    });
  } catch {
    return { error: t("failed_to_save_profile") };
  }

  revalidatePath("/app/profile");
  return { success: true };
}
