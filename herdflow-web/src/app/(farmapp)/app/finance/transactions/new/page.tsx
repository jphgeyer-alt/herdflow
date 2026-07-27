// WEBSITE — herdflow-web/src/app/(farmapp)/app/finance/transactions/new/page.tsx
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { suggestNextInvoiceNumber } from "@/lib/farm-finance/queries";
import { AddTransactionForm } from "./AddTransactionForm";

export const dynamic = "force-dynamic";

export default async function NewTransactionPage() {
  const t = await getTranslations("finance");
  const user = await getFarmWebUser();
  if (!user) return null;

  const suggestedInvoiceNumber = await suggestNextInvoiceNumber(user.effectiveFarmerId);

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">
      <header>
        <h1 className="text-navy-600 text-2xl font-semibold">{t("add_transaction_title")}</h1>
        <p className="text-sm text-navy-300">{t("add_transaction_subtitle")}</p>
      </header>
      <AddTransactionForm suggestedInvoiceNumber={suggestedInvoiceNumber} />
    </div>
  );
}
