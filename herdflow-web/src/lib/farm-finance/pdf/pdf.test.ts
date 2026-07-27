// herdflow-web/src/lib/farm-finance/pdf/pdf.test.ts
// F4 requires every finance PDF to actually generate, not just typecheck --
// renders each report with representative data and confirms real PDF bytes
// come out (magic header + a plausible size), so a future regression that
// breaks rendering (e.g. a bad style value @react-pdf/renderer can't parse)
// fails CI instead of only surfacing when a farmer clicks "Download PDF".
import { describe, it, expect } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { IncomeStatementPdf } from "./IncomeStatementPdf";
import { VatReportPdf } from "./VatReportPdf";
import { CashFlowStatementPdf } from "./CashFlowStatementPdf";

const common = {
  farmName: "Geyer Farms",
  ownerName: "J. Geyer",
  periodLabel: "This Month",
};

// PDF components take pre-translated strings as props (see IncomeStatementPdf.tsx
// for why) -- these fixtures stand in for what a route handler's
// getTranslations("finance") call would produce.
const preparedText = "Prepared using HerdFlow · Unaudited management accounts";
const generatedText = "Generated 26 Jul 2026, 14:30";

const incomeLabels = {
  tagline: "Farm Management Platform",
  reportTitle: "Income Statement (Profit & Loss)",
  reportMeta: "This Month · Unaudited management accounts",
  grossIncome: "Gross Income",
  costOfSales: "Cost of Sales (livestock purchases)",
  grossProfit: "Gross Profit",
  operatingExpenses: "Operating Expenses",
  noOperatingExpenses: "No operating expenses recorded this period.",
  totalOperatingExpenses: "Total Operating Expenses",
  netProfit: "Net Profit",
  netLoss: "Net Loss",
  preparedText,
  generatedText,
};

const vatLabels = {
  tagline: "Farm Management Platform",
  reportTitle: "VAT Report — VAT201 Preparation Summary",
  reportMeta: "This Month · VAT rate 15%",
  fieldSummaryTitle: "VAT201 Field Summary",
  field1: "Total Sales (Output Tax)",
  field4a: "Total VAT on Sales",
  field14: "Total Purchases (Input Tax)",
  field15: "Total VAT on Purchases",
  field19Payable: "Field 19 — VAT Payable",
  field19Refundable: "Field 19 — VAT Refundable",
  disclaimer:
    "This is a management summary only. Verify with your registered tax practitioner before submission to SARS.",
  preparedText,
  generatedText,
};

const cashFlowLabels = {
  tagline: "Farm Management Platform",
  reportTitle: "Cash Flow Statement",
  reportMeta: "This Month · Unaudited management accounts",
  operating: "Net Cash from Operating Activities",
  investing: "Net Cash from Investing Activities",
  investingNote: "livestock and equipment purchases",
  financing: "Net Cash from Financing Activities",
  financingNote:
    "no financing transactions recorded — loans, owner contributions, etc. are not yet tracked by HerdFlow",
  netMovement: "Net Movement in Cash",
  preparedText,
  generatedText,
};

function expectRealPdf(buf: Buffer) {
  expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
  expect(buf.length).toBeGreaterThan(500);
}

describe("Finance PDF reports (F4)", () => {
  it("renders the Income Statement", async () => {
    const buf = await renderToBuffer(
      IncomeStatementPdf({
        ...common,
        grossIncome: 150000,
        costOfSales: 40000,
        operatingExpenses: [
          { label: "Feed", amount: 20000 },
          { label: "Veterinary", amount: 5000 },
        ],
        labels: incomeLabels,
      }),
    );
    expectRealPdf(buf);
  });

  it("renders the Income Statement with zero operating expenses (empty state)", async () => {
    const buf = await renderToBuffer(
      IncomeStatementPdf({ ...common, grossIncome: 0, costOfSales: 0, operatingExpenses: [], labels: incomeLabels }),
    );
    expectRealPdf(buf);
  });

  it("renders the VAT Report", async () => {
    const buf = await renderToBuffer(
      VatReportPdf({
        ...common,
        totalSales: 150000,
        vatOnSales: 22500,
        totalPurchases: 65000,
        vatOnPurchases: 9750,
        vatOwing: 12750,
        labels: vatLabels,
      }),
    );
    expectRealPdf(buf);
  });

  it("renders the VAT Report when SARS owes the farmer (refundable)", async () => {
    const buf = await renderToBuffer(
      VatReportPdf({
        ...common,
        totalSales: 10000,
        vatOnSales: 1500,
        totalPurchases: 80000,
        vatOnPurchases: 12000,
        vatOwing: -10500,
        labels: vatLabels,
      }),
    );
    expectRealPdf(buf);
  });

  it("renders the Cash Flow Statement", async () => {
    const buf = await renderToBuffer(
      CashFlowStatementPdf({ ...common, operating: 85000, investing: -40000, financing: 0, labels: cashFlowLabels }),
    );
    expectRealPdf(buf);
  });
});
