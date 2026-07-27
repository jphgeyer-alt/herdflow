// WEBSITE — herdflow-web/src/lib/farm-finance/pdf/IncomeStatementPdf.tsx
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { pdfStyles, PdfHeader, PdfFooter, PdfRow, PdfBigRow } from "./layout";
import { formatCurrency } from "../format";

export interface IncomeStatementPdfProps {
  farmName: string;
  ownerName: string;
  periodLabel: string;
  grossIncome: number;
  costOfSales: number;
  operatingExpenses: { label: string; amount: number }[];
  // Pre-translated strings -- this component has no async translation-hook
  // context of its own (see layout.tsx), so the calling route handler
  // resolves every label via getTranslations() and passes the result down.
  labels: {
    tagline: string;
    reportTitle: string;
    reportMeta: string;
    grossIncome: string;
    costOfSales: string;
    grossProfit: string;
    operatingExpenses: string;
    noOperatingExpenses: string;
    totalOperatingExpenses: string;
    netProfit: string;
    netLoss: string;
    preparedText: string;
    generatedText: string;
  };
}

export function IncomeStatementPdf({
  farmName,
  ownerName,
  periodLabel,
  grossIncome,
  costOfSales,
  operatingExpenses,
  labels,
}: IncomeStatementPdfProps) {
  const grossProfit = grossIncome - costOfSales;
  const totalOpEx = operatingExpenses.reduce((s, r) => s + r.amount, 0);
  const netProfit = grossProfit - totalOpEx;

  return (
    <Document title={`${farmName} - Income Statement - ${periodLabel}`}>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          farmName={farmName}
          ownerName={ownerName}
          tagline={labels.tagline}
          reportTitle={labels.reportTitle}
          reportMeta={labels.reportMeta}
        />

        <View style={pdfStyles.section}>
          <PdfRow label={labels.grossIncome} value={formatCurrency(grossIncome)} />
          <PdfRow label={labels.costOfSales} value={`(${formatCurrency(costOfSales)})`} indent negative />
          <PdfBigRow label={labels.grossProfit} value={formatCurrency(grossProfit)} />
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>{labels.operatingExpenses}</Text>
          {operatingExpenses.length === 0 ? (
            <Text style={pdfStyles.rowLabelIndent}>{labels.noOperatingExpenses}</Text>
          ) : (
            operatingExpenses.map((row) => (
              <PdfRow key={row.label} label={row.label} value={`(${formatCurrency(row.amount)})`} indent negative />
            ))
          )}
          <PdfRow label={labels.totalOperatingExpenses} value={`(${formatCurrency(totalOpEx)})`} negative />
        </View>

        <View style={pdfStyles.section}>
          <PdfBigRow
            label={netProfit >= 0 ? labels.netProfit : labels.netLoss}
            value={formatCurrency(Math.abs(netProfit))}
          />
        </View>

        <PdfFooter preparedText={labels.preparedText} generatedText={labels.generatedText} />
      </Page>
    </Document>
  );
}
