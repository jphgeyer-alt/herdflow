// WEBSITE — herdflow-web/src/lib/pastureReportPdf.tsx
// PDF rendering for the "Download Pasture Report" button on /app/camps.
// Reuses the same header/footer/row primitives as the farm-finance PDFs
// (StyleSheet, PdfHeader, PdfFooter, PdfRow) -- these are generic PDF
// chrome, not finance-specific, so a second copy here would just be
// duplication of the exact same boilerplate.
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { pdfStyles, PdfHeader, PdfFooter } from "@/lib/farm-finance/pdf/layout";
import type { PastureReport } from "@/lib/pastureReport";

const NDVI_COLOR: Record<string, string> = {
  poor: "#C62828",
  fair: "#F57F17",
  good: "#9ACD32",
  excellent: "#2E7D32",
};

const styles = StyleSheet.create({
  campRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  scoreBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  scoreBadgeText: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  campInfo: { flex: 1 },
  campName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#1a2b4a" },
  campMeta: { fontSize: 8, color: "#5b6b85", marginTop: 1 },
  recommendation: { fontSize: 9, color: "#374766", marginTop: 3, lineHeight: 1.3 },
  noDataText: { fontSize: 9, color: "#8a94a6", fontStyle: "italic", marginTop: 1 },
  disclaimerBox: {
    marginTop: 4,
    padding: 8,
    backgroundColor: "#f3e8fd",
    borderRadius: 3,
    fontSize: 7,
    color: "#6a1b9a",
  },
});

export interface PastureReportPdfLabels {
  tagline: string;
  reportTitle: string;
  reportMeta: string;
  animalsLabel: string;
  hectaresLabel: string;
  noDataLabel: string;
  aiAdvisoryLabel: string;
  preparedText: string;
  generatedText: string;
  ndviLabel: (interpretation: string) => string;
  fallbackRecommendation: (interpretation: string) => string;
}

export function PastureReportPdf({
  farmName,
  ownerName,
  report,
  labels,
}: {
  farmName: string;
  ownerName: string;
  report: PastureReport;
  labels: PastureReportPdfLabels;
}) {
  return (
    <Document title={`${farmName} - Pasture Report`}>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          farmName={farmName}
          ownerName={ownerName}
          tagline={labels.tagline}
          reportTitle={labels.reportTitle}
          reportMeta={labels.reportMeta}
        />

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>{labels.reportTitle}</Text>
          {report.camps.map((camp) => (
            <View key={camp.id} style={styles.campRow} wrap={false}>
              <View
                style={[
                  styles.scoreBadge,
                  { backgroundColor: camp.ndvi ? NDVI_COLOR[camp.ndvi.reading.interpretation] : "#9CA3AF" },
                ]}
              >
                <Text style={styles.scoreBadgeText}>{camp.ndvi ? camp.ndvi.reading.score10 : "—"}</Text>
              </View>
              <View style={styles.campInfo}>
                <Text style={styles.campName}>{camp.name}</Text>
                <Text style={styles.campMeta}>
                  {labels.animalsLabel}: {camp.currentHeadCount} · {labels.hectaresLabel}:{" "}
                  {camp.hectares ?? "—"}
                  {camp.ndvi
                    ? ` · ${labels.ndviLabel(camp.ndvi.reading.interpretation)} · ${new Date(
                        camp.ndvi.reading.satellitePassDate,
                      ).toLocaleDateString("en-ZA")}`
                    : ""}
                </Text>
                {camp.ndvi ? (
                  <>
                    <Text style={styles.recommendation}>
                      {camp.ndvi.reading.aiAdvisory ||
                        labels.fallbackRecommendation(camp.ndvi.reading.interpretation)}
                    </Text>
                    {camp.ndvi.reading.aiAdvisory && (
                      <Text style={[styles.campMeta, { color: "#6a1b9a", fontFamily: "Helvetica-Bold" }]}>
                        {labels.aiAdvisoryLabel}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.noDataText}>{labels.noDataLabel}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.disclaimerBox}>{labels.aiAdvisoryLabel}</Text>

        <PdfFooter preparedText={labels.preparedText} generatedText={labels.generatedText} />
      </Page>
    </Document>
  );
}
