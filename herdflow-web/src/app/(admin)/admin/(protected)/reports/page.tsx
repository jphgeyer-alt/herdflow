import { getBusinessReportData } from "@/lib/reports/business-report";
import { ReportsPanel } from "./reports-panel";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const data = await getBusinessReportData();

  return (
    <main className="space-y-4 pb-10">
      <header>
        <h1 className="text-3xl font-semibold text-navy-600">Reports</h1>
        <p className="text-sm text-navy-400">
          Monthly sales breakdown, {Math.round(data.commissionRate * 100)}% commission tracker,
          profit &amp; loss, and top seller rankings. Export to CSV for accounting.
        </p>
      </header>
      <ReportsPanel data={data} />
    </main>
  );
}
