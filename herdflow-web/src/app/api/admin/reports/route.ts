import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import { getBusinessReportData } from "@/lib/reports/business-report";

function ensureAdmin(request: NextRequest) {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  return isValidAdminSession(session);
}

export async function GET(request: NextRequest) {
  if (!ensureAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format"); // "csv"

  const data = await getBusinessReportData();

  if (format === "csv") {
    const lines = [
      "Month,Total Sales (ZAR),Commission (ZAR),Marketing Revenue (ZAR),Expenses (ZAR),Net Profit (ZAR)",
      ...data.monthlyPnl.map((r) => {
        const sales = data.monthlySales.find((s) => s.month === r.month)?.totalCents ?? 0;
        return [
          r.month,
          (sales / 100).toFixed(2),
          (r.commissionCents / 100).toFixed(2),
          (r.marketingCents / 100).toFixed(2),
          (r.expenseCents / 100).toFixed(2),
          (r.netProfitCents / 100).toFixed(2),
        ].join(",");
      }),
      "",
      "Top Seller,Revenue (ZAR)",
      ...data.topSellers.map((s) => `${s.name},${(s.totalCents / 100).toFixed(2)}`),
      "",
      "Expense Category,Total (ZAR)",
      ...data.expensesByCategory.map((c) => `${c.category},${(c.totalCents / 100).toFixed(2)}`),
    ];
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="herdflow-report-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json(data);
}
