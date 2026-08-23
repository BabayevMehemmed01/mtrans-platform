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
import { useT } from "@/hooks/useT";
import type { TaskStatusCount } from "./types";

export const STATUS_COLORS: Record<string, string> = {
  NOT_PLANNED: "#94a3b8",
  BACKLOG: "#64748b",
  TODO: "#94a3b8",
  IN_PROGRESS: "#2563eb",
  IN_REVIEW: "#9333ea",
  REVIEW: "#8b5cf6",
  DONE: "#16a34a",
  CANCELLED: "#dc2626",
};

function statusLabel(t: (key: string) => string, status: string) {
  const translated = t(`status.${status}`);
  return translated === `status.${status}` ? status : translated;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { status: string; count: number } }>;
}) {
  const t = useT();
  if (!active || !payload?.length) return null;
  const { status, count } = payload[0].payload;

  return (
    <div className="animate-in zoom-in-95 rounded-xl border border-border bg-card p-4 shadow-xl duration-200">
      <div className="mb-2 flex items-center gap-2 border-b border-border/60 pb-2">
        <span className="h-3.5 w-3.5 rounded-full shadow-sm" style={{ backgroundColor: STATUS_COLORS[status] ?? "#cbd5e1" }} />
        <span className="text-[14px] font-black tracking-tight text-foreground">{statusLabel(t, status)}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-[13px] font-semibold text-muted-foreground">
        {t("reportsPage.taskCount")}
        <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-[15px] font-black text-foreground">
          {count}
        </span>
      </div>
    </div>
  );
}

export function TasksByStatusChart({ data }: { data: TaskStatusCount[] }) {
  const t = useT();
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-sm font-medium text-muted-foreground">
        {t("reportsPage.noTasksYet")}
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: statusLabel(t, d.status),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontWeight: 500 }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
          interval={0}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
          <LabelList
            dataKey="count"
            position="top"
            style={{ fontSize: 12, fill: "var(--muted-foreground)", fontWeight: 700 }}
          />
          {chartData.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "#64748b"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
