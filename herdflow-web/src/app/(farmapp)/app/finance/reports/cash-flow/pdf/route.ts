// WEBSITE — herdflow-web/src/app/(farmapp)/app/finance/reports/cash-flow/pdf/route.ts
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { getCashFlowStatement } from "@/lib/farm-finance/queries";
import { resolvePeriod, PERIOD_LABELS, type Period } from "@/lib/farm-finance/periods";
import { CashFlowStatementPdf } from "@/lib/farm-finance/pdf/CashFlowStatementPdf";
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

  const cf = await getCashFlowStatement(user.effectiveFarmerId, range);

  const buffer = await renderToBuffer(
    CashFlowStatementPdf({
      farmName: user.farmName || "Farm",
      ownerName: user.fullName,
      periodLabel,
      generatedAt: formatDateTime(new Date()),
      operating: cf.operating,
      investing: cf.investing,
      financing: cf.financing,
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cash-flow-statement-${period}.pdf"`,
    },
  });
}
