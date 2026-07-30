"use server";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/herd/[id]/edit/actions.ts
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { updateAnimal } from "@/lib/farm-herd/queries";

export interface EditAnimalState {
  error?: string;
  success?: boolean;
  successMessage?: string;
  redirectTo?: string;
}

export async function editAnimal(
  _prev: EditAnimalState,
  formData: FormData,
): Promise<EditAnimalState> {
  const t = await getTranslations("herd");
  const user = await getFarmWebUser();
  if (!user) redirect("/auth/login");

  const id = String(formData.get("id") ?? "");
  const species = String(formData.get("species") ?? "").trim();
  if (!species) return { error: t("select_species") };

  const name = String(formData.get("name") ?? "").trim();
  const tagNumber = String(formData.get("tagNumber") ?? "").trim();
  const breed = String(formData.get("breed") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim();
  const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim();
  const weightRaw = String(formData.get("weight") ?? "").trim();
  const colour = String(formData.get("colour") ?? "").trim();
  const camp = String(formData.get("camp") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const updated = await updateAnimal(user.effectiveFarmerId, id, {
    name: name || null,
    species,
    breed: breed || null,
    gender: gender || null,
    tagNumber: tagNumber || null,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
    weight: weightRaw ? Number(weightRaw) : null,
    colour: colour || null,
    camp: camp || null,
    notes: notes || null,
  }).catch(() => null);

  if (!updated) return { error: t("failed_to_save_animal") };

  revalidatePath("/app/herd");
  revalidatePath(`/app/herd/${id}`);
  return { success: true, successMessage: t("changes_saved"), redirectTo: `/app/herd/${id}` };
}
