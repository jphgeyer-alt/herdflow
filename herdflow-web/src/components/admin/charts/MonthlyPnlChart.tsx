"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCents } from "@/lib/money";
import { CHART_AXIS, CHART_COLORS, CHART_GRID, CHART_TICK_FONT_SIZE } from "./theme";

type MonthlyPnl = {
  month: string;
  commissionCents: number;
  marketingCents: number;
  expenseCents: number;
  netProfitCents: number;
};

function formatMonth(month: string): string {
  const [year, monthNum] = month.split("-");
  const date = new Date(Number(year), Number(monthNum) - 1, 1);
  return date.toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
}

export function MonthlyPnlChart({ data }: { data: MonthlyPnl[] }) {
  const chartData = data.map((row) => ({ ...row, monthLabel: formatMonth(row.month) }));

  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART_GRID} />
          <XAxis
            dataKey="monthLabel"
            tick={{ fontSize: CHART_TICK_FONT_SIZE, fill: CHART_AXIS }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => formatCents(v)}
            tick={{ fontSize: CHART_TICK_FONT_SIZE, fill: CHART_AXIS }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip
            formatter={(value) => formatCents(Number(value) || 0)}
            contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: CHART_GRID }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
          <Bar
            dataKey="commissionCents"
            name="Commission"
            stackId="income"
            fill={CHART_COLORS.commission}
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="marketingCents"
            name="Marketing"
            stackId="income"
            fill={CHART_COLORS.marketing}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="expenseCents"
            name="Expenses"
            fill={CHART_COLORS.expense}
            radius={[4, 4, 0, 0]}
            barSize={16}
          />
          <Line
            type="monotone"
            dataKey="netProfitCents"
            name="Net Profit"
            stroke={CHART_COLORS.netProfit}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
