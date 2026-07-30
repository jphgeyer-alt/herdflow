"use server";
// WEBSITE — herdflow-web/src/app/(farmapp)/app/finance/transactions/new/actions.ts
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { getComplianceConfig } from "@/lib/farm-finance/complianceConfig";

export interface AddTransactionState {
  error?: string;
  success?: boolean;
  successMessage?: string;
  redirectTo?: string;
}

export async function addTransaction(
  _prev: AddTransactionState,
  formData: FormData,
): Promise<AddTransactionState> {
  const t = await getTranslations("finance");
  const user = await getFarmWebUser();
  if (!user) redirect("/auth/login?redirect=/app/finance/transactions/new");

  const type = String(formData.get("type") ?? "");
  const category = String(formData.get("category") ?? "");
  const amount = Number(formData.get("amount"));
  const vatOn = formData.get("vatOn") === "on";
  const description = String(formData.get("description") ?? "").trim();
  const supplier = String(formData.get("supplier") ?? "").trim();
  const invoiceNumber = String(formData.get("invoiceNumber") ?? "").trim();
  const date = String(formData.get("date") ?? "");
  const paymentMethod = String(formData.get("paymentMethod") ?? "");
  const isRecurring = formData.get("isRecurring") === "on";
  const recurrence = String(formData.get("recurrence") ?? "");
  const unitCostRaw = String(formData.get("unitCost") ?? "").trim();
  const quantityRaw = String(formData.get("quantity") ?? "").trim();
  const isDepreciableAsset = formData.get("isDepreciableAsset") === "on";

  // Never allow an incomplete financial record to save silently (F3).
  if (type !== "income" && type !== "expense") return { error: t("select_income_expense") };
  if (!category) return { error: t("select_category") };
  if (!amount || amount <= 0) return { error: t("enter_valid_amount") };
  if (!description) return { error: t("enter_description") };
  if (!date) return { error: t("select_date") };
  const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "CARD", "OTHER"] as const;
  if (!PAYMENT_METHODS.includes(paymentMethod as (typeof PAYMENT_METHODS)[number])) {
    return { error: t("select_payment_method") };
  }
  const RECURRENCES = ["WEEKLY", "MONTHLY", "ANNUALLY"] as const;
  if (isRecurring && !RECURRENCES.includes(recurrence as (typeof RECURRENCES)[number])) {
    return { error: t("select_recurrence") };
  }

  const vatAmount = vatOn ? Math.round(amount * getComplianceConfig(user.country).vatRate * 100) / 100 : 0;
  // Unit cost/quantity/depreciable-asset only apply to equipment purchases
  // (F6) -- kept null/false for every other category, same as every
  // existing row recorded before this feature existed.
  const isEquipment = category === "equipment";
  const unitCost = isEquipment && unitCostRaw ? Number(unitCostRaw) : null;
  const quantity = isEquipment && quantityRaw ? Number(quantityRaw) : null;

  try {
    await withFarmerContext(user.effectiveFarmerId!, (tx) =>
      tx.farmerTransaction.create({
        data: {
          farmerId: user.effectiveFarmerId,
          type,
          category,
          amount,
          vatAmount,
          description,
          supplier: supplier || null,
          invoiceNumber: invoiceNumber || null,
          date: new Date(date),
          paymentMethod: paymentMethod as (typeof PAYMENT_METHODS)[number],
          isRecurring,
          recurrence: isRecurring ? (recurrence as (typeof RECURRENCES)[number]) : null,
          unitCost,
          quantity,
          isDepreciableAsset: isEquipment && isDepreciableAsset,
        },
      }),
    );
  } catch {
    // Never let a DB failure fall through to Next's generic error boundary --
    // the farmer needs to see this and retry, not lose the form silently.
    return { error: t("failed_to_save_transaction") };
  }

  revalidatePath("/app/finance");
  revalidatePath("/app/finance/transactions");
  return {
    success: true,
    successMessage: t("transaction_saved"),
    redirectTo: "/app/finance/transactions",
  };
}
