// WEBSITE — herdflow-web/src/app/(farmapp)/app/finance/transactions/page.tsx
// F5: sortable table + filter bar + CSV export live in TransactionsTable
// (client component) -- this server component's only job is to fetch every
// non-deleted transaction and compute each row's running balance in
// chronological order before handing off.
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PlusCircle } from "lucide-react";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { Card, CardHeader } from "@/components/farm/Card";
import { TransactionsTable, type TxRow } from "./TransactionsTable";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const t = await getTranslations("finance");
  const user = await getFarmWebUser();
  if (!user) return null;

  const transactions = await withFarmerContext(user.effectiveFarmerId, (tx) =>
    tx.farmerTransaction.findMany({
      where: { farmerId: user.effectiveFarmerId, isDeleted: false },
      orderBy: { date: "asc" },
      take: 1000,
    }),
  );

  // Running balance is only meaningful computed in chronological order --
  // once attached per-row it stays correct as a fact about that transaction
  // even if the table is later re-sorted by another column.
  let balance = 0;
  const rows: TxRow[] = transactions.map((t) => {
    const amount = Number(t.amount);
    const vatAmount = Number(t.vatAmount);
    balance += t.type === "income" ? amount + vatAmount : -(amount + vatAmount);
    return {
      id: t.id,
      date: t.date.toISOString(),
      description: t.description,
      category: t.category,
      supplier: t.supplier,
      amount,
      vatAmount,
      invoiceNumber: t.invoiceNumber,
      type: t.type as "income" | "expense",
      runningBalance: balance,
    };
  });
  rows.reverse(); // newest first by default, matching every other list in this app

  return (
    <div className="space-y-6 pb-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-navy-600 text-2xl font-semibold">{t("transactions")}</h1>
          <p className="text-sm text-navy-300">{t("transactions_recorded_count", { count: rows.length })}</p>
        </div>
        <Link
          href="/app/finance/transactions/new"
          className="flex items-center gap-2 rounded-lg bg-navy-600 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700"
        >
          <PlusCircle size={16} /> {t("add_transaction")}
        </Link>
      </header>

      <Card>
        <CardHeader title={t("all_transactions")} />
        <div className="p-4">
          <TransactionsTable rows={rows} />
        </div>
      </Card>
    </div>
  );
}
