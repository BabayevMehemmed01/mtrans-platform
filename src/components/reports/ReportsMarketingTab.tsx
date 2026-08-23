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
import { Megaphone, Send, Users2, PercentCircle } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useT } from "@/hooks/useT";
import { StatCard, ChartCard, EmptyChartState } from "./StatCard";
import { CampaignStatusBadge } from "@/components/marketing/StatusBadge";
import type { ReportsMarketingData } from "./types";
import type { CampaignStatus } from "@/components/marketing/types";

const CHANNEL_COLORS: Record<string, string> = {
  EMAIL: "#2563eb",
  SMS: "#f59e0b",
  WHATSAPP: "#059669",
  INSTAGRAM: "#db2777",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "#64748b",
  SCHEDULED: "#2563eb",
  IN_PROGRESS: "#f59e0b",
  COMPLETED: "#059669",
};

const CHANNEL_KEYS: Record<string, string> = {
  EMAIL: "marketing.channelEmailShort",
  SMS: "marketing.channelSmsShort",
  WHATSAPP: "marketing.channelWhatsappShort",
  INSTAGRAM: "marketing.channelInstagramShort",
};

const CAMPAIGN_STATUS_KEYS: Record<string, string> = {
  DRAFT: "marketing.statusDraft",
  SCHEDULED: "marketing.statusScheduled",
  IN_PROGRESS: "marketing.statusInProgress",
  COMPLETED: "marketing.statusCompleted",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function ReportsMarketingTab({ data }: { data: ReportsMarketingData }) {
  const t = useT();

  const channelLabel = (type: string) => t(CHANNEL_KEYS[type] ?? "") || type;
  const campaignStatusLabel = (status: string) => t(CAMPAIGN_STATUS_KEYS[status] ?? "") || status;

  const channelData = data.channelBreakdown
    .map((c) => ({ name: channelLabel(c.type), key: c.type, count: c.count }))
    .filter((c) => c.count > 0);

  const statusPieData = data.statusBreakdown
    .map((s) => ({ name: campaignStatusLabel(s.status), key: s.status, value: s.count }))
    .filter((s) => s.value > 0);

  const deliveryData = [{ name: t("reportsPage.messages"), sent: data.totalSent, failed: data.totalFailed }];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Megaphone} label={t("reportsPage.totalCampaigns")} value={data.totalCampaigns} accent="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={Send} label={t("reportsPage.activeScheduled")} value={data.activeCampaigns} accent="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={Users2} label={t("reportsPage.totalRecipients")} value={data.totalRecipients} accent="text-purple-600" bg="bg-purple-50" />
        <StatCard icon={PercentCircle} label={t("reportsPage.deliveryRate")} value={`${data.deliveryRate}%`} accent="text-emerald-600" bg="bg-emerald-50" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("reportsPage.campaignsByChannel")} description={t("reportsPage.campaignsByChannelDesc")}>
          {channelData.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={channelData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={44}>
                  {channelData.map((entry) => (
                    <Cell key={entry.key} fill={CHANNEL_COLORS[entry.key] ?? "#64748b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title={t("reportsPage.campaignStatus")} description={t("reportsPage.campaignStatusDesc")}>
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

      <ChartCard title={t("reportsPage.sendResults")} description={t("reportsPage.sendResultsDesc")}>
        {data.totalSent === 0 && data.totalFailed === 0 ? (
          <EmptyChartState />
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={deliveryData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="sent" name={t("reportsPage.sent")} fill="#059669" radius={[0, 4, 4, 0]} maxBarSize={28} />
              <Bar dataKey="failed" name={t("reportsPage.failed")} fill="#dc2626" radius={[0, 4, 4, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <div className="rounded-2xl shadow-sm">
        <p className="px-1 pb-2 text-sm font-semibold">{t("reportsPage.recentCampaigns")}</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("reportsPage.name")}</TableHead>
              <TableHead>{t("reportsPage.channel")}</TableHead>
              <TableHead>{t("reportsPage.status")}</TableHead>
              <TableHead className="text-right">{t("reportsPage.sentRecipients")}</TableHead>
              <TableHead className="text-right">{t("reportsPage.date")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.recentCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  {t("reportsPage.noCampaigns")}
                </TableCell>
              </TableRow>
            ) : (
              data.recentCampaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-sm font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{channelLabel(c.type)}</TableCell>
                  <TableCell>
                    <CampaignStatusBadge status={c.status as CampaignStatus} />
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {c.sentCount} / {c.recipientCount}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
