"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatRand } from "@/lib/marketing/format";
import { CHART_AXIS, CHART_COLORS, CHART_GRID, CHART_TICK_FONT_SIZE } from "./theme";

type Stream = { label: string; total: number };

// `total` is Rand (Payment.amount is a Decimal Rand column), not cents —
// matches the existing table on the Revenue page, which formats the same
// streamTotals with formatRand() directly.
export function RevenueByStreamChart({ streams }: { streams: Stream[] }) {
  if (streams.length === 0) return null;

  return (
    <div style={{ width: "100%", height: Math.max(streams.length * 44, 120) }}>
      <ResponsiveContainer>
        <BarChart data={streams} layout="vertical" margin={{ left: 12, right: 24 }}>
          <CartesianGrid horizontal={false} stroke={CHART_GRID} />
          <XAxis
            type="number"
            tickFormatter={(v: number) => formatRand(v)}
            tick={{ fontSize: CHART_TICK_FONT_SIZE, fill: CHART_AXIS }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={170}
            tick={{ fontSize: CHART_TICK_FONT_SIZE, fill: CHART_AXIS }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => formatRand(Number(value) || 0)}
            contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: CHART_GRID }}
          />
          <Bar dataKey="total" fill={CHART_COLORS.revenue} radius={[0, 4, 4, 0]} barSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
