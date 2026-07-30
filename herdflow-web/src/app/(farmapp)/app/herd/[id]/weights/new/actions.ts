"use server";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/herd/[id]/weights/new/actions.ts
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { addWeightRecord } from "@/lib/farm-herd/queries";

export interface AddWeightState {
  error?: string;
}

export async function addWeight(_prev: AddWeightState, formData: FormData): Promise<AddWeightState> {
  const t = await getTranslations("herd");
  const user = await getFarmWebUser();
  if (!user) redirect("/auth/login");

  const animalId = String(formData.get("animalId") ?? "");
  const weightRaw = String(formData.get("weight") ?? "").trim();
  const bcsRaw = String(formData.get("bodyConditionScore") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const recordedDate = String(formData.get("recordedDate") ?? "").trim();

  const weight = Number(weightRaw);
  if (!weightRaw || Number.isNaN(weight) || weight <= 0) return { error: t("required_field") };

  const record = await addWeightRecord(user.effectiveFarmerId, animalId, {
    weight,
    bodyConditionScore: bcsRaw ? Number(bcsRaw) : null,
    notes: notes || null,
    recordedDate: recordedDate ? new Date(recordedDate) : new Date(),
  }).catch(() => null);

  if (!record) return { error: t("failed_to_save_weight") };

  revalidatePath(`/app/herd/${animalId}`);
  redirect(`/app/herd/${animalId}`);
}
