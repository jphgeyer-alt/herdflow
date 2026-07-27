// WEBSITE — herdflow-web/src/lib/farm-finance/pdf/CashFlowStatementPdf.tsx
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { pdfStyles, PdfHeader, PdfFooter, PdfRow, PdfBigRow } from "./layout";
import { formatCurrency } from "../format";

export interface CashFlowStatementPdfProps {
  farmName: string;
  ownerName: string;
  periodLabel: string;
  operating: number;
  investing: number;
  financing: number;
  // Pre-translated strings -- see IncomeStatementPdf.tsx for why this
  // component can't call getTranslations()/useTranslations() itself.
  labels: {
    tagline: string;
    reportTitle: string;
    reportMeta: string;
    operating: string;
    investing: string;
    investingNote: string;
    financing: string;
    financingNote: string;
    netMovement: string;
    preparedText: string;
    generatedText: string;
  };
}

function activityValue(n: number): string {
  return n < 0 ? `(${formatCurrency(Math.abs(n))})` : formatCurrency(n);
}

export function CashFlowStatementPdf({
  farmName,
  ownerName,
  periodLabel,
  operating,
  investing,
  financing,
  labels,
}: CashFlowStatementPdfProps) {
  const netMovement = operating + investing + financing;

  return (
    <Document title={`${farmName} - Cash Flow Statement - ${periodLabel}`}>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          farmName={farmName}
          ownerName={ownerName}
          tagline={labels.tagline}
          reportTitle={labels.reportTitle}
          reportMeta={labels.reportMeta}
        />

        <View style={pdfStyles.section}>
          <PdfRow label={labels.operating} value={activityValue(operating)} negative={operating < 0} />
          <PdfRow label={labels.investing} value={activityValue(investing)} negative={investing < 0} />
          <Text style={[pdfStyles.rowLabelIndent, { marginTop: -4, marginBottom: 4 }]}>
            ({labels.investingNote})
          </Text>
          <PdfRow label={labels.financing} value={activityValue(financing)} negative={financing < 0} />
          <Text style={[pdfStyles.rowLabelIndent, { marginTop: -4, marginBottom: 4 }]}>
            ({labels.financingNote})
          </Text>
          <PdfBigRow label={labels.netMovement} value={activityValue(netMovement)} />
        </View>

        <PdfFooter preparedText={labels.preparedText} generatedText={labels.generatedText} />
      </Page>
    </Document>
  );
}
