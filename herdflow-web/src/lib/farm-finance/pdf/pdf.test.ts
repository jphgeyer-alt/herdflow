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
  generatedAt: "26 Jul 2026, 14:30",
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
      }),
    );
    expectRealPdf(buf);
  });

  it("renders the Income Statement with zero operating expenses (empty state)", async () => {
    const buf = await renderToBuffer(
      IncomeStatementPdf({ ...common, grossIncome: 0, costOfSales: 0, operatingExpenses: [] }),
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
      }),
    );
    expectRealPdf(buf);
  });

  it("renders the Cash Flow Statement", async () => {
    const buf = await renderToBuffer(
      CashFlowStatementPdf({ ...common, operating: 85000, investing: -40000, financing: 0 }),
    );
    expectRealPdf(buf);
  });
});
