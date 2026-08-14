"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
  ResponsiveContainer,
} from "recharts";

export interface TaskStatusCount {
  status: string;
  count: number;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  BACKLOG: { label: "Növbəti", color: "#64748b" },
  TODO: { label: "Gözləyir", color: "#94a3b8" },
  IN_PROGRESS: { label: "Davam edir", color: "#2563eb" },
  IN_REVIEW: { label: "Nəzərdən keçirilir", color: "#9333ea" },
  DONE: { label: "Tamamlandı", color: "#16a34a" },
  CANCELLED: { label: "Ləğv edildi", color: "#dc2626" },
};

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { status: string; count: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const { status, count } = payload[0].payload;
  const meta = STATUS_META[status];
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-[hsl(var(--foreground))]">{meta?.label ?? status}</p>
      <p className="text-[hsl(var(--muted-foreground))] mt-0.5">{count} tapşırıq</p>
    </div>
  );
}

export function TasksByStatusChart({ data }: { data: TaskStatusCount[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
        Hələ tapşırıq yoxdur
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: STATUS_META[d.status]?.label ?? d.status,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          axisLine={{ stroke: "hsl(var(--border))" }}
          tickLine={false}
          interval={0}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))" }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
          <LabelList
            dataKey="count"
            position="top"
            style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 600 }}
          />
          {chartData.map((entry) => (
            <Cell key={entry.status} fill={STATUS_META[entry.status]?.color ?? "#64748b"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
