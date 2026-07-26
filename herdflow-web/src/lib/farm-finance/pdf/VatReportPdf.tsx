// WEBSITE — herdflow-web/src/lib/farm-finance/pdf/VatReportPdf.tsx
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { pdfStyles, PdfHeader, PdfFooter } from "./layout";
import { formatCurrency } from "../format";

export interface VatReportPdfProps {
  farmName: string;
  ownerName: string;
  periodLabel: string;
  generatedAt: string;
  totalSales: number;
  vatOnSales: number;
  totalPurchases: number;
  vatOnPurchases: number;
  vatOwing: number;
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
  generatedAt,
  totalSales,
  vatOnSales,
  totalPurchases,
  vatOnPurchases,
  vatOwing,
}: VatReportPdfProps) {
  return (
    <Document title={`${farmName} - VAT Report - ${periodLabel}`}>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          farmName={farmName}
          ownerName={ownerName}
          reportTitle="VAT Report — VAT201 Preparation Summary"
          reportMeta={`${periodLabel} · VAT rate 15%`}
        />

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>VAT201 Field Summary</Text>
          <VatFieldRow field="Field 1" label="Total Sales (Output Tax)" value={formatCurrency(totalSales)} />
          <VatFieldRow field="Field 4A" label="Total VAT on Sales" value={formatCurrency(vatOnSales)} />
          <VatFieldRow field="Field 14" label="Total Purchases (Input Tax)" value={formatCurrency(totalPurchases)} />
          <VatFieldRow field="Field 15" label="Total VAT on Purchases" value={formatCurrency(vatOnPurchases)} />
          <View style={pdfStyles.bigRow}>
            <Text style={pdfStyles.bigLabel}>
              Field 19 — {vatOwing >= 0 ? "VAT Payable" : "VAT Refundable"}
            </Text>
            <Text style={pdfStyles.bigValue}>{formatCurrency(Math.abs(vatOwing))}</Text>
          </View>
        </View>

        <Text style={pdfStyles.disclaimer}>
          This is a management summary only. Verify with your registered tax practitioner before
          submission to SARS.
        </Text>

        <PdfFooter generatedAt={generatedAt} />
      </Page>
    </Document>
  );
}
