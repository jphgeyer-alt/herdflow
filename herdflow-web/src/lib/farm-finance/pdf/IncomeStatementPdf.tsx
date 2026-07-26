// WEBSITE — herdflow-web/src/lib/farm-finance/pdf/IncomeStatementPdf.tsx
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { pdfStyles, PdfHeader, PdfFooter, PdfRow, PdfBigRow } from "./layout";
import { formatCurrency } from "../format";

export interface IncomeStatementPdfProps {
  farmName: string;
  ownerName: string;
  periodLabel: string;
  generatedAt: string;
  grossIncome: number;
  costOfSales: number;
  operatingExpenses: { label: string; amount: number }[];
}

export function IncomeStatementPdf({
  farmName,
  ownerName,
  periodLabel,
  generatedAt,
  grossIncome,
  costOfSales,
  operatingExpenses,
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
          reportTitle="Income Statement (Profit & Loss)"
          reportMeta={`${periodLabel} · Unaudited management accounts`}
        />

        <View style={pdfStyles.section}>
          <PdfRow label="Gross Income" value={formatCurrency(grossIncome)} />
          <PdfRow label="Cost of Sales (livestock purchases)" value={`(${formatCurrency(costOfSales)})`} indent negative />
          <PdfBigRow label="Gross Profit" value={formatCurrency(grossProfit)} />
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Operating Expenses</Text>
          {operatingExpenses.length === 0 ? (
            <Text style={pdfStyles.rowLabelIndent}>No operating expenses recorded this period.</Text>
          ) : (
            operatingExpenses.map((row) => (
              <PdfRow key={row.label} label={row.label} value={`(${formatCurrency(row.amount)})`} indent negative />
            ))
          )}
          <PdfRow label="Total Operating Expenses" value={`(${formatCurrency(totalOpEx)})`} negative />
        </View>

        <View style={pdfStyles.section}>
          <PdfBigRow label={netProfit >= 0 ? "Net Profit" : "Net Loss"} value={formatCurrency(Math.abs(netProfit))} />
        </View>

        <PdfFooter generatedAt={generatedAt} />
      </Page>
    </Document>
  );
}
