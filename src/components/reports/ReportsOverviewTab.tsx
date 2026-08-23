"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FolderKanban, ListChecks, CheckCircle2, Users, Building2, AlertTriangle } from "lucide-react";
import { StatCard, ChartCard, EmptyChartState } from "./StatCard";
import { TasksByStatusChart } from "./TasksByStatusChart";
import { TasksTrendChart } from "./TasksTrendChart";
import type { ReportsOverviewData } from "./types";

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  URGENT: { label: "Təcili", color: "#dc2626" },
  HIGH: { label: "Yüksək", color: "#f97316" },
  MEDIUM: { label: "Orta", color: "#2563eb" },
  LOW: { label: "Aşağı", color: "#94a3b8" },
};

interface ReportsOverviewTabProps {
  data: ReportsOverviewData;
  isVisible: (key: string, defaultVisible?: boolean) => boolean;
}

export function ReportsOverviewTab({ data, isVisible }: ReportsOverviewTabProps) {
  const priorityPieData = data.priorityData
    .map((p) => ({ name: PRIORITY_META[p.priority]?.label ?? p.priority, key: p.priority, value: p.count }))
    .filter((p) => p.value > 0);

  const departmentBarData = data.departmentWorkload
    .filter((d) => d.taskCount > 0)
    .sort((a, b) => b.taskCount - a.taskCount)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {isVisible("statCards") && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard icon={FolderKanban} label="Aktiv Layihələr" value={`${data.activeProjects}/${data.totalProjects}`} accent="text-blue-600" bg="bg-blue-50" />
          <StatCard icon={ListChecks} label="Cəmi Tapşırıq" value={data.totalTasks} accent="text-purple-600" bg="bg-purple-50" />
          <StatCard icon={CheckCircle2} label="Tamamlanma faizi" value={`${data.overallProgress}%`} accent="text-emerald-600" bg="bg-emerald-50" />
          <StatCard icon={AlertTriangle} label="Gecikmiş Tapşırıq" value={data.overdueTasks} accent="text-red-600" bg="bg-red-50" />
          <StatCard icon={Users} label="Komanda Üzvləri" value={data.memberCount} accent="text-amber-600" bg="bg-amber-50" />
          <StatCard icon={Building2} label="Şöbələr" value={data.departmentCount} accent="text-cyan-600" bg="bg-cyan-50" />
        </div>
      )}

      {isVisible("statusTrend", true) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Tapşırıqlar — Status üzrə" description="Bütün layihələr üzrə status bölgüsü">
            <TasksByStatusChart data={data.statusChartData} />
          </ChartCard>
          <ChartCard title="Tamamlanma Trendi (14 gün)" description="Son 14 gündə gündəlik tamamlanan tapşırıqlar">
            <TasksTrendChart data={data.trendData} />
          </ChartCard>
        </div>
      )}

      {isVisible("priorityDept", true) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Prioritet Bölgüsü" description="Aktiv tapşırıqların prioritetə görə payı">
            {priorityPieData.length === 0 ? (
              <EmptyChartState />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={priorityPieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                    {priorityPieData.map((entry) => (
                      <Cell key={entry.key} fill={PRIORITY_META[entry.key]?.color ?? "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Şöbələr üzrə İş Yükü" description="Şöbələrin layihələrindəki aktiv tapşırıq sayı (Top 8)">
            {departmentBarData.length === 0 ? (
              <EmptyChartState />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={departmentBarData}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Bar dataKey="taskCount" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {departmentBarData.map((entry) => (
                      <Cell key={entry.id} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      )}
    </div>
  );
}
