// WEBSITE — herdflow-web/src/app/(farmapp)/app/camps/pasture-report/pdf/route.ts
// Downloads the same worst-first NDVI ranking shown on /app/camps as an
// actual PDF file, using the exact same buildPastureReport() query the
// on-screen ranking panel uses so the two can never disagree (same pattern
// as finance/reports/pdf/route.ts).
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getFarmWebUser } from "@/lib/farm-web-auth";
import { buildPastureReport } from "@/lib/pastureReport";
import { PastureReportPdf } from "@/lib/pastureReportPdf";

export const dynamic = "force-dynamic";

export async function GET() {
  const t = await getTranslations("camps");
  const user = await getFarmWebUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const report = await buildPastureReport(user.effectiveFarmerId);
  const generatedAt = report.generatedAt.toLocaleString("en-ZA");

  const buffer = await renderToBuffer(
    PastureReportPdf({
      farmName: user.farmName || "HerdFlow Farm",
      ownerName: user.fullName || "",
      report,
      labels: {
        tagline: t("camps_section_title"),
        reportTitle: t("download_pasture_report"),
        reportMeta: `${report.camps.length} camps · ${generatedAt}`,
        animalsLabel: t("animals_label"),
        hectaresLabel: t("hectares_label"),
        noDataLabel: t("no_satellite_data_yet"),
        aiAdvisoryLabel: t("ai_advisory_label"),
        preparedText: t("camps_section_title"),
        generatedText: `Generated ${generatedAt}`,
        ndviLabel: (interpretation) => t(`ndvi_${interpretation}`),
        fallbackRecommendation: (interpretation) => t(`ndvi_fallback_${interpretation}`),
      },
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="pasture-report-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}
