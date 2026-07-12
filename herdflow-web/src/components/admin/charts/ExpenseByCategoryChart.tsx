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
import { formatCents } from "@/lib/money";
import { CHART_AXIS, CHART_COLORS, CHART_GRID, CHART_TICK_FONT_SIZE } from "./theme";

type ExpenseCategory = { category: string; totalCents: number };

export function ExpenseByCategoryChart({ categories }: { categories: ExpenseCategory[] }) {
  if (categories.length === 0) return null;

  return (
    <div style={{ width: "100%", height: Math.max(categories.length * 40, 120) }}>
      <ResponsiveContainer>
        <BarChart data={categories} layout="vertical" margin={{ left: 12, right: 24 }}>
          <CartesianGrid horizontal={false} stroke={CHART_GRID} />
          <XAxis
            type="number"
            tickFormatter={(v: number) => formatCents(v)}
            tick={{ fontSize: CHART_TICK_FONT_SIZE, fill: CHART_AXIS }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="category"
            width={150}
            tick={{ fontSize: CHART_TICK_FONT_SIZE, fill: CHART_AXIS }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => formatCents(Number(value) || 0)}
            contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: CHART_GRID }}
          />
          <Bar dataKey="totalCents" fill={CHART_COLORS.cost} radius={[0, 4, 4, 0]} barSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
