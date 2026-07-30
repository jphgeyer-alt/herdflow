"use server";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/health/new/actions.ts
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { createHealthEvent } from "@/lib/farm-health/queries";

export interface AddHealthEventState {
  error?: string;
  success?: boolean;
  successMessage?: string;
  redirectTo?: string;
}

export async function addHealthEvent(
  _prev: AddHealthEventState,
  formData: FormData,
): Promise<AddHealthEventState> {
  const t = await getTranslations("health");
  const user = await getFarmWebUser();
  if (!user) redirect("/auth/login?redirect=/app/health/new");

  const animalId = String(formData.get("animalId") ?? "").trim();
  const eventType = String(formData.get("eventType") ?? "").trim();
  if (!animalId) return { error: t("select_animal") };
  if (!eventType) return { error: t("select_event_type") };

  const description = String(formData.get("description") ?? "").trim();
  const diagnosis = String(formData.get("diagnosis") ?? "").trim();
  const treatment = String(formData.get("treatment") ?? "").trim();
  const vetName = String(formData.get("vetName") ?? "").trim();
  const severity = String(formData.get("severity") ?? "").trim();
  const costRaw = String(formData.get("cost") ?? "").trim();
  const followUpDate = String(formData.get("followUpDate") ?? "").trim();
  const eventDate = String(formData.get("eventDate") ?? "").trim();

  const record = await createHealthEvent(user.effectiveFarmerId, {
    animalId,
    eventType,
    description: description || null,
    diagnosis: diagnosis || null,
    treatment: treatment || null,
    vetName: vetName || null,
    severity: severity || null,
    cost: costRaw ? Number(costRaw) : null,
    followUpDate: followUpDate ? new Date(followUpDate) : null,
    eventDate: eventDate ? new Date(eventDate) : new Date(),
  }).catch(() => null);

  if (!record) return { error: t("failed_to_save_event") };

  revalidatePath("/app/health");
  revalidatePath(`/app/herd/${animalId}`);
  return { success: true, successMessage: t("event_saved"), redirectTo: "/app/health" };
}
