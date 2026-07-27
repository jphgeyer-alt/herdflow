// WEBSITE — herdflow-web/src/lib/farm-finance/pdf/VatReportPdf.tsx
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { pdfStyles, PdfHeader, PdfFooter } from "./layout";
import { formatCurrency } from "../format";

export interface VatReportPdfProps {
  farmName: string;
  ownerName: string;
  periodLabel: string;
  totalSales: number;
  vatOnSales: number;
  totalPurchases: number;
  vatOnPurchases: number;
  vatOwing: number;
  // Pre-translated strings -- see IncomeStatementPdf.tsx for why this
  // component can't call getTranslations()/useTranslations() itself.
  labels: {
    tagline: string;
    reportTitle: string;
    reportMeta: string;
    fieldSummaryTitle: string;
    field1: string;
    field4a: string;
    field14: string;
    field15: string;
    field19Payable: string;
    field19Refundable: string;
    disclaimer: string;
    preparedText: string;
    generatedText: string;
  };
}

function VatFieldRow({ field, label, value }: { field: string; label: string; value: string }) {
  return (
    <View style={pdfStyles.row}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={pdfStyles.fieldBadge}>{field}</Text>
        <Text style={pdfStyles.rowLabel}>{label}</Text>
      </View>
      <Text style={pdfStyles.rowValue}>{value}</Text>
    </View>
  );
}

export function VatReportPdf({
  farmName,
  ownerName,
  periodLabel,
  totalSales,
  vatOnSales,
  totalPurchases,
  vatOnPurchases,
  vatOwing,
  labels,
}: VatReportPdfProps) {
  return (
    <Document title={`${farmName} - VAT Report - ${periodLabel}`}>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          farmName={farmName}
          ownerName={ownerName}
          tagline={labels.tagline}
          reportTitle={labels.reportTitle}
          reportMeta={labels.reportMeta}
        />

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>{labels.fieldSummaryTitle}</Text>
          <VatFieldRow field="Field 1" label={labels.field1} value={formatCurrency(totalSales)} />
          <VatFieldRow field="Field 4A" label={labels.field4a} value={formatCurrency(vatOnSales)} />
          <VatFieldRow field="Field 14" label={labels.field14} value={formatCurrency(totalPurchases)} />
          <VatFieldRow field="Field 15" label={labels.field15} value={formatCurrency(vatOnPurchases)} />
          <View style={pdfStyles.bigRow}>
            <Text style={pdfStyles.bigLabel}>{vatOwing >= 0 ? labels.field19Payable : labels.field19Refundable}</Text>
            <Text style={pdfStyles.bigValue}>{formatCurrency(Math.abs(vatOwing))}</Text>
          </View>
        </View>

        <Text style={pdfStyles.disclaimer}>{labels.disclaimer}</Text>

        <PdfFooter preparedText={labels.preparedText} generatedText={labels.generatedText} />
      </Page>
    </Document>
  );
}
