"use server";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/health/medicines/new/actions.ts
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { createMedicine } from "@/lib/farm-health/queries";

export interface AddMedicineState {
  error?: string;
}

export async function addMedicine(
  _prev: AddMedicineState,
  formData: FormData,
): Promise<AddMedicineState> {
  const t = await getTranslations("health");
  const user = await getFarmWebUser();
  if (!user) redirect("/auth/login?redirect=/app/health/medicines/new");

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  if (!name || !category) return { error: t("required_field") };

  const manufacturer = String(formData.get("manufacturer") ?? "").trim();
  const dosageUnit = String(formData.get("dosageUnit") ?? "").trim();
  const quantityRaw = String(formData.get("quantityInStock") ?? "").trim();
  const reorderRaw = String(formData.get("reorderLevel") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  try {
    await createMedicine(user.effectiveFarmerId, {
      name,
      category,
      manufacturer: manufacturer || null,
      dosageUnit: dosageUnit || null,
      quantityInStock: quantityRaw ? Number(quantityRaw) : 0,
      reorderLevel: reorderRaw ? Number(reorderRaw) : null,
      notes: notes || null,
    });
  } catch {
    return { error: t("failed_to_save_medicine") };
  }

  revalidatePath("/app/health/medicines");
  redirect("/app/health/medicines");
}
