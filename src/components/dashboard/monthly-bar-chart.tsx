"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/format";

export function MonthlyBarChart({
  data,
  dataKey,
  format,
}: {
  data: { label: string; value: number }[];
  dataKey?: string;
  format?: "currency" | "number";
}) {
  const valueFormatter = (v: number) => (format === "currency" ? formatCurrency(v) : String(v));
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          stroke="var(--muted-foreground)"
        />
        <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" width={40} />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          formatter={(value) => valueFormatter(Number(value))}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--popover-foreground)",
          }}
        />
        <Bar dataKey={dataKey ?? "value"} fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
}
