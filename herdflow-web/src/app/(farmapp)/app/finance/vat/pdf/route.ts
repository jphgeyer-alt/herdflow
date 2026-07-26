// WEBSITE — herdflow-web/src/app/(farmapp)/app/finance/vat/pdf/route.ts
// F4: downloads the VAT201 preparation summary shown on /app/finance/vat as
// an actual PDF, reusing the same getFinanceTotals() the on-screen page uses.
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { getFinanceTotals } from "@/lib/farm-finance/queries";
import { resolvePeriod, PERIOD_LABELS, type Period } from "@/lib/farm-finance/periods";
import { VatReportPdf } from "@/lib/farm-finance/pdf/VatReportPdf";
import { formatDateTime } from "@/lib/farm-finance/format";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getFarmWebUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const { period, range } = resolvePeriod({
    period: searchParams.get("period") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });
  const periodLabel = period === "custom" ? "Custom Range" : PERIOD_LABELS[period as Exclude<Period, "custom">];

  const totals = await getFinanceTotals(user.effectiveFarmerId, range);

  const buffer = await renderToBuffer(
    VatReportPdf({
      farmName: user.farmName || "Farm",
      ownerName: user.fullName,
      periodLabel,
      generatedAt: formatDateTime(new Date()),
      totalSales: totals.income,
      vatOnSales: totals.vatCollected,
      totalPurchases: totals.expenses,
      vatOnPurchases: totals.vatPaid,
      vatOwing: totals.vatOwing,
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="vat-report-${period}.pdf"`,
    },
  });
}
