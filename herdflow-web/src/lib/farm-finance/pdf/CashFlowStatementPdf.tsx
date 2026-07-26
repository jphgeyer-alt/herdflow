// WEBSITE — herdflow-web/src/lib/farm-finance/pdf/CashFlowStatementPdf.tsx
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { pdfStyles, PdfHeader, PdfFooter, PdfRow, PdfBigRow } from "./layout";
import { formatCurrency } from "../format";

export interface CashFlowStatementPdfProps {
  farmName: string;
  ownerName: string;
  periodLabel: string;
  generatedAt: string;
  operating: number;
  investing: number;
  financing: number;
}

function activityValue(n: number): string {
  return n < 0 ? `(${formatCurrency(Math.abs(n))})` : formatCurrency(n);
}

export function CashFlowStatementPdf({
  farmName,
  ownerName,
  periodLabel,
  generatedAt,
  operating,
  investing,
  financing,
}: CashFlowStatementPdfProps) {
  const netMovement = operating + investing + financing;

  return (
    <Document title={`${farmName} - Cash Flow Statement - ${periodLabel}`}>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          farmName={farmName}
          ownerName={ownerName}
          reportTitle="Cash Flow Statement"
          reportMeta={`${periodLabel} · Unaudited management accounts`}
        />

        <View style={pdfStyles.section}>
          <PdfRow
            label="Net Cash from Operating Activities"
            value={activityValue(operating)}
            negative={operating < 0}
          />
          <PdfRow
            label="Net Cash from Investing Activities"
            value={activityValue(investing)}
            negative={investing < 0}
          />
          <Text style={[pdfStyles.rowLabelIndent, { marginTop: -4, marginBottom: 4 }]}>
            (livestock and equipment purchases)
          </Text>
          <PdfRow
            label="Net Cash from Financing Activities"
            value={activityValue(financing)}
            negative={financing < 0}
          />
          <Text style={[pdfStyles.rowLabelIndent, { marginTop: -4, marginBottom: 4 }]}>
            (no financing transactions recorded — loans, owner contributions, etc. are not yet
            tracked by HerdFlow)
          </Text>
          <PdfBigRow label="Net Movement in Cash" value={activityValue(netMovement)} />
        </View>

        <PdfFooter generatedAt={generatedAt} />
      </Page>
    </Document>
  );
}
