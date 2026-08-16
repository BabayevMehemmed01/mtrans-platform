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

// YENİ: Modern və cəlbedici Hover (Tooltip) dizaynı
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
    <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-xl animate-in zoom-in-95 duration-200">
      <div className="flex items-center gap-2 mb-2 border-b border-gray-50 pb-2">
        <span 
          className="w-3.5 h-3.5 rounded-full shadow-sm" 
          style={{ backgroundColor: meta?.color ?? "#cbd5e1" }}
        />
        <span className="text-[14px] font-black text-slate-800 tracking-tight">
          {meta?.label ?? status}
        </span>
      </div>
      <div className="text-[13px] font-semibold text-slate-500 flex items-center justify-between gap-4">
        Tapşırıq sayı: 
        <span className="font-black text-[15px] text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md border border-gray-100">
          {count}
        </span>
      </div>
    </div>
  );
}

export function TasksByStatusChart({ data }: { data: TaskStatusCount[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  if (total === 0) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm font-bold text-slate-400 bg-slate-50 rounded-xl border border-dashed border-gray-200">
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
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
          axisLine={{ stroke: "hsl(var(--border))" }}
          tickLine={false}
          interval={0}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip 
          content={<CustomTooltip />} 
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }} 
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={36}>
          <LabelList
            dataKey="count"
            position="top"
            style={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontWeight: 700 }}
          />
          {chartData.map((entry) => (
            <Cell key={entry.status} fill={STATUS_META[entry.status]?.color ?? "#64748b"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}