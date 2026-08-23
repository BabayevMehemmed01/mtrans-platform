"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Wallet, Handshake, Trophy, Percent } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/hooks/useT";
import { StatCard, ChartCard, EmptyChartState } from "./StatCard";
import type { ReportsCrmData } from "./types";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "#2563eb",
  WON: "#16a34a",
  LOST: "#dc2626",
};

function formatMoney(value: number) {
  return value.toLocaleString("az-AZ", { maximumFractionDigits: 0 });
}

export function ReportsCrmTab({ data }: { data: ReportsCrmData }) {
  const t = useT();

  const statusLabel = (status: string) => {
    if (status === "OPEN") return t("reportsPage.open");
    if (status === "WON") return t("reportsPage.won");
    if (status === "LOST") return t("reportsPage.lost");
    return status;
  };

  const stageData = data.stageBreakdown.filter((s) => s.count > 0);
  const statusPieData = data.statusBreakdown
    .map((s) => ({ name: statusLabel(s.status), key: s.status, value: s.count }))
    .filter((s) => s.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Wallet} label={t("reportsPage.pipelineValue")} value={`${formatMoney(data.totalPipelineValue)} AZN`} accent="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={Handshake} label={t("reportsPage.openDeals")} value={data.openDealsCount} accent="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={Trophy} label={t("reportsPage.wonThisMonth")} value={`${data.wonThisMonthCount} (${formatMoney(data.wonThisMonthValue)} AZN)`} accent="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={Percent} label={t("reportsPage.winRate")} value={`${data.winRate}%`} accent="text-purple-600" bg="bg-purple-50" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("reportsPage.pipelineByStage")} description={t("reportsPage.pipelineByStageDesc")}>
          {stageData.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stageData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                <Tooltip formatter={(value) => `${formatMoney(Number(value))} AZN`} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={44}>
                  {stageData.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title={t("reportsPage.dealStatusBreakdown")} description={t("reportsPage.dealStatusBreakdownDesc")}>
          {statusPieData.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusPieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {statusPieData.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard title={t("reportsPage.monthlyDealTrend")} description={t("reportsPage.monthlyDealTrendDesc")}>
        {data.monthlyTrend.every((m) => m.created === 0 && m.won === 0) ? (
          <EmptyChartState />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.monthlyTrend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="crmCreatedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="crmWonFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="created" name={t("reportsPage.created")} stroke="#2563eb" strokeWidth={2} fill="url(#crmCreatedFill)" />
              <Area type="monotone" dataKey="won" name={t("reportsPage.won")} stroke="#16a34a" strokeWidth={2} fill="url(#crmWonFill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <div className="rounded-2xl shadow-sm">
        <p className="px-1 pb-2 text-sm font-semibold">{t("reportsPage.topOpenDeals")}</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("reportsPage.deal")}</TableHead>
              <TableHead>{t("reportsPage.client")}</TableHead>
              <TableHead>{t("reportsPage.stage")}</TableHead>
              <TableHead className="text-right">{t("reportsPage.value")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.topDeals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  {t("reportsPage.noOpenDeals")}
                </TableCell>
              </TableRow>
            ) : (
              data.topDeals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="text-sm font-medium">{deal.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {deal.clientCompany || deal.clientName || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="rounded-full px-2.5 py-1 font-medium"
                      style={{ color: deal.stageColor, borderColor: deal.stageColor, backgroundColor: `${deal.stageColor}14` }}
                    >
                      {deal.stageName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold">
                    {formatMoney(deal.value)} {deal.currency}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
