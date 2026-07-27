// WEBSITE — herdflow-web/src/app/(farmapp)/app/finance/vat/pdf/route.ts
// F4: downloads the VAT201 preparation summary shown on /app/finance/vat as
// an actual PDF, reusing the same getFinanceTotals() the on-screen page uses.
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { getFinanceTotals } from "@/lib/farm-finance/queries";
import { resolvePeriod, type Period } from "@/lib/farm-finance/periods";
import { VatReportPdf } from "@/lib/farm-finance/pdf/VatReportPdf";
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

  const totals = await getFinanceTotals(user.effectiveFarmerId, range);

  // VAT rate is duplicated across both platforms today (flagged in the G1
  // audit) -- G4's LocaleConfig will centralize it. Not this task's scope.
  const generatedAt = formatDateTime(new Date());
  const buffer = await renderToBuffer(
    VatReportPdf({
      farmName: user.farmName || t("farm_fallback"),
      ownerName: user.fullName,
      periodLabel,
      totalSales: totals.income,
      vatOnSales: totals.vatCollected,
      totalPurchases: totals.expenses,
      vatOnPurchases: totals.vatPaid,
      vatOwing: totals.vatOwing,
      labels: {
        tagline: t("platform_tagline"),
        reportTitle: t("vat_report_pdf_title"),
        reportMeta: `${periodLabel} · ${t("vat_rate_meta", { rate: 15 })}`,
        fieldSummaryTitle: t("vat201_field_summary"),
        field1: t("vat_field_1"),
        field4a: t("vat_field_4a"),
        field14: t("vat_field_14"),
        field15: t("vat_field_15"),
        field19Payable: t("vat_field_19_payable"),
        field19Refundable: t("vat_field_19_refundable"),
        disclaimer: t("vat_disclaimer"),
        preparedText: t("prepared_using_pdf_footer"),
        generatedText: t("generated_on", { date: generatedAt }),
      },
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="vat-report-${period}.pdf"`,
    },
  });
}
