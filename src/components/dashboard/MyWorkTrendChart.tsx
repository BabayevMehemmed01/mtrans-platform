"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface WeeklyCompletedPoint {
  date: string; // "dd.MM" formatında göstəriləcək label
  count: number;
}

const ACCENT = "#16a34a";

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-slate-900">{label}</p>
      <p className="text-slate-500 mt-0.5">{payload[0].value} tapşırıq tamamlandı</p>
    </div>
  );
}

export function MyWorkTrendChart({ data }: { data: WeeklyCompletedPoint[] }) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="h-[140px] flex items-center justify-center text-sm text-muted-foreground">
        Son 7 gündə tamamlanmış tapşırıq yoxdur
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          width={24}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f1f5f9" }} />
        <Bar dataKey="count" fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
