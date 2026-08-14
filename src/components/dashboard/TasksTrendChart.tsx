"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface TasksTrendPoint {
  date: string; // "dd.MM" formatında göstəriləcək label
  count: number;
}

const ACCENT = "#2563eb";

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
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-[hsl(var(--foreground))]">{label}</p>
      <p className="text-[hsl(var(--muted-foreground))] mt-0.5">
        {payload[0].value} tapşırıq tamamlandı
      </p>
    </div>
  );
}

export function TasksTrendChart({ data }: { data: TasksTrendPoint[] }) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm text-[hsl(var(--muted-foreground))]">
        Son 14 gündə tamamlanmış tapşırıq yoxdur
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="tasksTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT} stopOpacity={0.18} />
            <stop offset="100%" stopColor={ACCENT} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={{ stroke: "hsl(var(--border))" }}
          tickLine={false}
          interval={1}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--border))" }} />
        <Area
          type="monotone"
          dataKey="count"
          stroke={ACCENT}
          strokeWidth={2}
          fill="url(#tasksTrendFill)"
          dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: ACCENT, stroke: "hsl(var(--card))", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
