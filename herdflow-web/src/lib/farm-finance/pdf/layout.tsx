// WEBSITE — herdflow-web/src/lib/farm-finance/pdf/layout.tsx
// Shared header/footer/typography for every farm-finance PDF (F4). Kept in
// one place so Income Statement, VAT Report and Cash Flow Statement can
// never visually drift from each other -- a bookkeeper opening all three
// should recognise them as one report family.
import { StyleSheet, Text, View, Font } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";

// @react-pdf/renderer has no built-in font with the weights we need beyond
// Helvetica -- Helvetica/Helvetica-Bold ship with the PDF spec itself (no
// network font fetch, no risk of a silent fallback at render time).
Font.registerHyphenationCallback((word) => [word]);

export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 90,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a2b4a",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0f2444",
    color: "#ffffff",
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  brandSub: { fontSize: 8, color: "#9db3d6", marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  farmName: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  ownerName: { fontSize: 8, color: "#c3d0e8", marginTop: 1 },
  reportTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#ffffff", marginTop: 10 },
  reportMeta: { fontSize: 8, color: "#c3d0e8", marginTop: 2 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingBottom: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  footerRow: { flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: "#8a94a6" },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#5b6b85",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  rowLabel: { fontSize: 10, color: "#374766" },
  rowLabelIndent: { fontSize: 10, color: "#5b6b85", paddingLeft: 12 },
  rowValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1a2b4a" },
  rowValueNegative: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#b91c1c" },
  bigRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderTopWidth: 1.5,
    borderTopColor: "#1a2b4a",
    marginTop: 2,
  },
  bigLabel: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#1a2b4a" },
  bigValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: "#1a2b4a" },
  disclaimer: {
    marginTop: 16,
    padding: 10,
    backgroundColor: "#fef3c7",
    borderRadius: 3,
    fontSize: 8,
    color: "#92400e",
  },
  fieldBadge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#1a2b4a",
    backgroundColor: "#e8edf6",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 6,
  },
});

export function PdfHeader({
  farmName,
  ownerName,
  tagline,
  reportTitle,
  reportMeta,
}: {
  farmName: string;
  ownerName: string;
  tagline: string;
  reportTitle: string;
  reportMeta: string;
}) {
  return (
    <View style={pdfStyles.header} fixed>
      <View style={pdfStyles.headerTopRow}>
        <View>
          <Text style={pdfStyles.brand}>HerdFlow</Text>
          <Text style={pdfStyles.brandSub}>{tagline}</Text>
        </View>
        <View style={pdfStyles.headerRight}>
          <Text style={pdfStyles.farmName}>{farmName}</Text>
          <Text style={pdfStyles.ownerName}>{ownerName}</Text>
        </View>
      </View>
      <Text style={pdfStyles.reportTitle}>{reportTitle}</Text>
      <Text style={pdfStyles.reportMeta}>{reportMeta}</Text>
    </View>
  );
}

// preparedText/generatedText arrive pre-translated from the calling route
// handler -- this file has no async translation-hook context of its own
// (it's rendered synchronously by @react-pdf/renderer, not part of the
// Next.js request-render tree).
export function PdfFooter({ preparedText, generatedText }: { preparedText: string; generatedText: string }) {
  return (
    <View style={pdfStyles.footer} fixed>
      <View style={pdfStyles.footerRow}>
        <Text style={pdfStyles.footerText}>{preparedText}</Text>
        <Text style={pdfStyles.footerText}>{generatedText}</Text>
      </View>
      <Text
        style={[pdfStyles.footerText, { marginTop: 3 }]}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

export function PdfRow({
  label,
  value,
  indent,
  negative,
}: {
  label: string;
  value: string;
  indent?: boolean;
  negative?: boolean;
}) {
  return (
    <View style={pdfStyles.row}>
      <Text style={indent ? pdfStyles.rowLabelIndent : pdfStyles.rowLabel}>{label}</Text>
      <Text style={negative ? pdfStyles.rowValueNegative : pdfStyles.rowValue}>{value}</Text>
    </View>
  );
}

export function PdfBigRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={pdfStyles.bigRow}>
      <Text style={pdfStyles.bigLabel}>{label}</Text>
      <Text style={pdfStyles.bigValue}>{value}</Text>
    </View>
  );
}

export type PdfStyle = Style;
