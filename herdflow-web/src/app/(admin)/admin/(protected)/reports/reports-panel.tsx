import { Download } from "lucide-react";
import { Card, CardHeader, StatCard } from "@/components/admin/Card";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/admin/Table";
import { TableEmptyRow } from "@/components/admin/EmptyState";
import { buttonClass } from "@/components/admin/button-styles";

type MonthRow = { month: string; totalCents: number };
type TopSeller = { name: string; totalCents: number };
type ExpenseCategory = { category: string; totalCents: number };
type MonthlyPnl = {
  month: string;
  commissionCents: number;
  marketingCents: number;
  expenseCents: number;
  netProfitCents: number;
};

type ReportsData = {
  monthlySales: MonthRow[];
  totalRevenueCents: number;
  totalCommissionCents: number;
  livestockCommissionCents: number;
  productCommissionCents: number;
  topSellers: TopSeller[];
  livestockSold: number;
  commissionRate: number;
  marketingRevenueCents: number;
  expensesCents: number;
  netProfitCents: number;
  expensesByCategory: ExpenseCategory[];
  monthlyPnl: MonthlyPnl[];
};

type ReportsPanelProps = {
  data: ReportsData;
};

function toCurrency(cents: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function barWidth(value: number, max: number) {
  if (max === 0) return "0%";
  return `${Math.round((value / max) * 100)}%`;
}

export function ReportsPanel({ data }: ReportsPanelProps) {
  const commissionPct = Math.round(data.commissionRate * 100);
  const businessRevenueCents = data.totalCommissionCents + data.marketingRevenueCents;
  const maxMonthly = Math.max(...data.monthlySales.map((r) => r.totalCents), 1);

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Gross Marketplace Volume" value={toCurrency(data.totalRevenueCents)} />
        <StatCard
          label={`Total Commission (${commissionPct}%)`}
          value={toCurrency(data.totalCommissionCents)}
          accent="gold"
        />
        <StatCard label="Product Commission" value={toCurrency(data.productCommissionCents)} />
        <StatCard label="Livestock Sold" value={String(data.livestockSold)} accent="green" />
      </div>

      {/* Monthly bar chart */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy-600">
            Gross Sales by Month (last 12 months)
          </h2>
          <a
            href="/api/admin/reports?format=csv"
            download
            className={buttonClass("outline", "sm")}
          >
            <Download size={14} /> Export CSV
          </a>
        </div>
        <div className="space-y-2">
          {data.monthlySales.map((row) => (
            <div key={row.month} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-right text-xs text-navy-300">{row.month}</span>
              <div className="h-5 flex-1 overflow-hidden rounded bg-navy-25">
                <div
                  className="h-full rounded bg-navy-600/70 transition-all"
                  style={{ width: barWidth(row.totalCents, maxMonthly) }}
                />
              </div>
              <span className="w-28 shrink-0 text-right text-xs font-medium text-navy-500">
                {toCurrency(row.totalCents)}
              </span>
              <span className="w-24 shrink-0 text-right text-xs text-navy-300">
                {toCurrency(Math.round(row.totalCents * data.commissionRate))} comm.
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Profit & Loss */}
      <div className="space-y-4">
        <CardHeader
          title="Profit & Loss"
          action={
            <a href="/admin/expenses" className="text-sm font-semibold text-navy-600 hover:underline">
              Manage Expenses →
            </a>
          }
        />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard label="Commission Revenue" value={toCurrency(data.totalCommissionCents)} />
          <StatCard label="Marketing Revenue" value={toCurrency(data.marketingRevenueCents)} />
          <StatCard label="Total Revenue" value={toCurrency(businessRevenueCents)} />
          <StatCard label="Expenses" value={toCurrency(data.expensesCents)} accent="gold" />
          <StatCard
            label="Net Profit"
            value={toCurrency(data.netProfitCents)}
            accent={data.netProfitCents < 0 ? "danger" : "green"}
          />
        </div>

        <Card>
          <Table>
            <Thead>
              <Tr>
                <Th>Month</Th>
                <Th align="right">Commission</Th>
                <Th align="right">Marketing</Th>
                <Th align="right">Expenses</Th>
                <Th align="right">Net Profit</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.monthlyPnl.length === 0 ? (
                <TableEmptyRow colSpan={5} message="No profit & loss data yet." />
              ) : (
                data.monthlyPnl.map((row) => (
                  <Tr key={row.month}>
                    <Td>{row.month}</Td>
                    <Td align="right">{toCurrency(row.commissionCents)}</Td>
                    <Td align="right">{toCurrency(row.marketingCents)}</Td>
                    <Td align="right">{toCurrency(row.expenseCents)}</Td>
                    <Td
                      align="right"
                      className={`font-semibold ${row.netProfitCents < 0 ? "text-red-600" : "text-green"}`}
                    >
                      {toCurrency(row.netProfitCents)}
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Card>

        {data.expensesByCategory.length > 0 && (
          <Card>
            <CardHeader title="Expenses by Category" />
            <Table>
              <Tbody>
                {data.expensesByCategory.map((c) => (
                  <Tr key={c.category}>
                    <Td className="font-medium text-navy-600">{c.category}</Td>
                    <Td align="right">{toCurrency(c.totalCents)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Card>
        )}
      </div>

      {/* Top sellers */}
      <Card>
        <CardHeader title="Top Sellers by Revenue" />
        <Table>
          <Thead>
            <Tr>
              <Th>#</Th>
              <Th>Seller / Farm</Th>
              <Th align="right">Revenue</Th>
              <Th align="right">Commission ({commissionPct}%)</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.topSellers.length === 0 ? (
              <TableEmptyRow colSpan={4} message="No sales data yet." />
            ) : (
              data.topSellers.map((seller, i) => (
                <Tr key={seller.name}>
                  <Td className="font-mono text-navy-300">{i + 1}</Td>
                  <Td className="font-medium text-navy-600">{seller.name}</Td>
                  <Td align="right">{toCurrency(seller.totalCents)}</Td>
                  <Td align="right" className="text-navy-300">
                    {toCurrency(Math.round(seller.totalCents * data.commissionRate))}
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
