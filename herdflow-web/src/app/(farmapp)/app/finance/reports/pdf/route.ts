// WEBSITE — herdflow-web/src/app/(farmapp)/app/finance/reports/pdf/route.ts
// F4: downloads the Income Statement shown on /app/finance/reports as an
// actual PDF file, using the exact same query logic as the on-screen
// preview so the two can never disagree.
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { withFarmerContext } from "@/lib/tenant-prisma";
import { resolvePeriod, type Period } from "@/lib/farm-finance/periods";
import { categoryLabelKey } from "@/lib/farm-finance/categories";
import { IncomeStatementPdf } from "@/lib/farm-finance/pdf/IncomeStatementPdf";
import { formatDateTime } from "@/lib/farm-finance/format";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const t = await getTranslations("finance");
  const user = await getFarmWebUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const { period, range } = resolvePeriod({
    period: searchParams.get("period") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });
  const periodLabel = period === "custom" ? t("custom_range") : t(period as Exclude<Period, "custom">);

  const rows = await withFarmerContext(user.effectiveFarmerId, (tx) =>
    tx.farmerTransaction.findMany({
      where: { farmerId: user.effectiveFarmerId, isDeleted: false, date: { gte: range.start, lte: range.end } },
    }),
  );

  const grossIncome = rows.filter((r) => r.type === "income").reduce((s, r) => s + Number(r.amount), 0);
  const costOfSales = rows
    .filter((r) => r.type === "expense" && r.category === "livestock_purchase")
    .reduce((s, r) => s + Number(r.amount), 0);

  const opExByCategory = new Map<string, number>();
  for (const r of rows) {
    if (r.type !== "expense" || r.category === "livestock_purchase") continue;
    opExByCategory.set(r.category, (opExByCategory.get(r.category) ?? 0) + Number(r.amount));
  }
  const operatingExpenses = [...opExByCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amount]) => ({ label: t(categoryLabelKey(cat)), amount }));

  const generatedAt = formatDateTime(new Date());
  const buffer = await renderToBuffer(
    IncomeStatementPdf({
      farmName: user.farmName || t("farm_fallback"),
      ownerName: user.fullName || "",
      periodLabel,
      grossIncome,
      costOfSales,
      operatingExpenses,
      labels: {
        tagline: t("platform_tagline"),
        reportTitle: t("income_statement_full_title"),
        reportMeta: `${periodLabel} · ${t("unaudited_management_accounts")}`,
        grossIncome: t("gross_income"),
        costOfSales: t("cost_of_sales"),
        grossProfit: t("gross_profit"),
        operatingExpenses: t("operating_expenses"),
        noOperatingExpenses: t("no_operating_expenses"),
        totalOperatingExpenses: t("total_operating_expenses"),
        netProfit: t("net_profit"),
        netLoss: t("net_loss"),
        preparedText: t("prepared_using_pdf_footer"),
        generatedText: t("generated_on", { date: generatedAt }),
      },
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="income-statement-${period}.pdf"`,
    },
  });
}
