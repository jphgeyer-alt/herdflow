"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatRand } from "@/lib/marketing/format";
import { CHART_AXIS, CHART_COLORS, CHART_GRID, CHART_TICK_FONT_SIZE } from "./theme";

type MonthRow = { month: string; total: number };

function formatMonth(month: string): string {
  const [year, monthNum] = month.split("-");
  const date = new Date(Number(year), Number(monthNum) - 1, 1);
  return date.toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
}

// Labeled by what the data actually is — monthly SUBSCRIPTION-type Payment
// sums — not "MRR trend": true MRR is a point-in-time snapshot of active
// subscriptions, not what was collected that month (renewals, upgrades, and
// once-off annual payments all land in the month they were paid, not spread
// across the period they cover).
export function SubscriptionRevenueByMonthChart({ data }: { data: MonthRow[] }) {
  const chartData = data.map((row) => ({ ...row, monthLabel: formatMonth(row.month) }));

  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="subscriptionRevenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.revenue} stopOpacity={0.25} />
              <stop offset="100%" stopColor={CHART_COLORS.revenue} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={CHART_GRID} />
          <XAxis
            dataKey="monthLabel"
            tick={{ fontSize: CHART_TICK_FONT_SIZE, fill: CHART_AXIS }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => formatRand(v)}
            tick={{ fontSize: CHART_TICK_FONT_SIZE, fill: CHART_AXIS }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip
            formatter={(value) => formatRand(Number(value) || 0)}
            contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: CHART_GRID }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke={CHART_COLORS.revenue}
            strokeWidth={2}
            fill="url(#subscriptionRevenueFill)"
            dot={{ r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
