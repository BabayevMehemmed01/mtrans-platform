"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

export interface TimeSlice {
  name: string;
  value: number;
  color: string;
}

export function MyLoggedTimeChart({ data }: { data: TimeSlice[] }) {
  const hasData = data.some((d) => d.value > 0);

  if (!hasData) {
    return (
      <div className="flex h-[180px] flex-col items-center justify-center gap-1 text-center text-sm text-muted-foreground">
        <p>Hələ vaxt qeydə alınmayıb</p>
        <p className="text-xs">No logged time yet</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={190}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={44}
          outerRadius={72}
          paddingAngle={2}
        >
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `${Number(value).toFixed(1)} saat`} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
