import Link from "next/link";
import { withAdminContext } from "@/lib/tenant-prisma";
import { getBusinessReportData } from "@/lib/reports/business-report";
import { getMrr } from "@/lib/reports/mrr";
import { formatRand } from "@/lib/marketing/format";
import { formatCents } from "@/lib/money";
import { Card, CardHeader, StatCard } from "@/components/admin/Card";
import { TrendingUp, DollarSign, Wallet, AlertCircle, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

const SECTIONS = [
  {
    label: "Revenue",
    href: "/admin/revenue",
    description: "MRR and revenue by payment stream.",
  },
  {
    label: "Seller Payouts",
    href: "/admin/payouts",
    description: "Track and settle what HerdFlow owes each seller.",
  },
  {
    label: "Expenses",
    href: "/admin/expenses",
    description: "Business costs, receipts, and recurring bills.",
  },
  {
    label: "Reports",
    href: "/admin/reports",
    description: "Commission tracker, P&L, and seller analytics.",
  },
];

export default async function AdminFinanceOverviewPage() {
  const [{ mrr }, report, pendingPayouts] = await Promise.all([
    getMrr(),
    getBusinessReportData(),
    withAdminContext(async (tx) => {
      const [sellerPending, logisticsPending] = await Promise.all([
        tx.sellerPayout.aggregate({ where: { status: "PENDING" }, _sum: { amountCents: true } }),
        tx.logisticsPayout.aggregate({ where: { status: "PENDING" }, _sum: { amountCents: true } }),
      ]);
      return (sellerPending._sum.amountCents ?? 0) + (logisticsPending._sum.amountCents ?? 0);
    }),
  ]);

  // Approximation, not a bank-reconciled balance: net profit earned to date
  // minus payouts still owed but not yet paid out. There's no general
  // ledger or bank-feed behind this — it's directionally correct, not exact.
  const cashPositionCents = report.netProfitCents - pendingPayouts;

  return (
    <main className="space-y-6 pb-10">
      <header>
        <h1 className="text-navy-600 text-3xl font-semibold">Finance</h1>
        <p className="text-sm text-navy-300">
          MRR, net profit, cash position, and outstanding payables at a glance.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="MRR"
          value={formatRand(mrr)}
          icon={<TrendingUp size={18} />}
          accent="green"
        />
        <StatCard
          label="Net Profit (all time)"
          value={formatCents(report.netProfitCents)}
          icon={<DollarSign size={18} />}
          accent={report.netProfitCents < 0 ? "danger" : "navy"}
        />
        <StatCard
          label="Cash Position"
          value={formatCents(cashPositionCents)}
          icon={<Wallet size={18} />}
          accent={cashPositionCents < 0 ? "danger" : "gold"}
          hint="Approximate — net profit minus unpaid payouts, not a bank balance"
        />
        <StatCard
          label="Outstanding Payables"
          value={formatCents(pendingPayouts)}
          icon={<AlertCircle size={18} />}
          accent={pendingPayouts > 0 ? "danger" : "navy"}
          hint="Pending seller + logistics payouts"
        />
      </div>

      <Card>
        <CardHeader title="Finance Sections" description="Jump into the detail behind these numbers." />
        <div className="grid gap-px bg-navy-50 sm:grid-cols-2">
          {SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="flex items-center justify-between gap-3 bg-white p-4 hover:bg-navy-25"
            >
              <div>
                <p className="font-semibold text-navy-600">{section.label}</p>
                <p className="mt-0.5 text-sm text-navy-300">{section.description}</p>
              </div>
              <ArrowRight size={16} className="shrink-0 text-navy-300" />
            </Link>
          ))}
        </div>
      </Card>
    </main>
  );
}
