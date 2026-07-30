"use server";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/herd/new/actions.ts
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { createAnimal } from "@/lib/farm-herd/queries";

export interface AddAnimalState {
  error?: string;
}

export async function addAnimal(_prev: AddAnimalState, formData: FormData): Promise<AddAnimalState> {
  const t = await getTranslations("herd");
  const user = await getFarmWebUser();
  if (!user) redirect("/auth/login?redirect=/app/herd/new");

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
  const source = String(formData.get("source") ?? "").trim();
  const purchasePriceRaw = String(formData.get("purchasePrice") ?? "").trim();
  const dateAcquired = String(formData.get("dateAcquired") ?? "").trim();

  let animal;
  try {
    animal = await createAnimal(user.effectiveFarmerId, {
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
      source: source || null,
      purchasePrice: purchasePriceRaw ? Number(purchasePriceRaw) : null,
      dateAcquired: dateAcquired ? new Date(dateAcquired) : null,
    });
  } catch {
    return { error: t("failed_to_save_animal") };
  }

  revalidatePath("/app/herd");
  redirect(`/app/herd/${animal.id}`);
}
