"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/farm-finance/format";
import { CHART_AXIS, CHART_COLORS, CHART_GRID, CHART_TICK_FONT_SIZE } from "./theme";

export interface CashFlowMonth {
  monthLabel: string;
  income: number;
  expense: number;
}

export function CashFlowChart({ data }: { data: CashFlowMonth[] }) {
  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 12, left: 12, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART_GRID} />
          <XAxis
            dataKey="monthLabel"
            tick={{ fontSize: CHART_TICK_FONT_SIZE, fill: CHART_AXIS }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => formatCurrency(v)}
            tick={{ fontSize: CHART_TICK_FONT_SIZE, fill: CHART_AXIS }}
            axisLine={false}
            tickLine={false}
            width={100}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value) || 0)}
            contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: CHART_GRID }}
          />
          {/* Required secondary encoding for this palette (see theme.ts) --
              legend + name labels, never color alone. */}
          <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
          <Bar dataKey="income" name="Income" fill={CHART_COLORS.income} radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Expenses" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
