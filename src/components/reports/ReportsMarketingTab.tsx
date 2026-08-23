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
import { StatCard, ChartCard, EmptyChartState } from "./StatCard";
import { CampaignStatusBadge } from "@/components/marketing/StatusBadge";
import type { ReportsMarketingData } from "./types";
import type { CampaignStatus } from "@/components/marketing/types";

const CHANNEL_META: Record<string, { label: string; color: string }> = {
  EMAIL: { label: "Email", color: "#2563eb" },
  SMS: { label: "SMS", color: "#f59e0b" },
  WHATSAPP: { label: "WhatsApp", color: "#059669" },
  INSTAGRAM: { label: "Instagram", color: "#db2777" },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Qaralama", color: "#64748b" },
  SCHEDULED: { label: "Planlaşdırılıb", color: "#2563eb" },
  IN_PROGRESS: { label: "İcrada", color: "#f59e0b" },
  COMPLETED: { label: "Tamamlanıb", color: "#059669" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function ReportsMarketingTab({ data }: { data: ReportsMarketingData }) {
  const channelData = data.channelBreakdown
    .map((c) => ({ name: CHANNEL_META[c.type]?.label ?? c.type, key: c.type, count: c.count }))
    .filter((c) => c.count > 0);

  const statusPieData = data.statusBreakdown
    .map((s) => ({ name: STATUS_META[s.status]?.label ?? s.status, key: s.status, value: s.count }))
    .filter((s) => s.value > 0);

  const deliveryData = [{ name: "Mesajlar", sent: data.totalSent, failed: data.totalFailed }];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Megaphone} label="Cəmi Kampaniya" value={data.totalCampaigns} accent="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={Send} label="Aktiv / Planlaşdırılan" value={data.activeCampaigns} accent="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={Users2} label="Cəmi Alıcı" value={data.totalRecipients} accent="text-purple-600" bg="bg-purple-50" />
        <StatCard icon={PercentCircle} label="Çatdırılma Faizi" value={`${data.deliveryRate}%`} accent="text-emerald-600" bg="bg-emerald-50" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Kanal üzrə Kampaniyalar" description="Email / SMS / WhatsApp / Instagram bölgüsü">
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
                    <Cell key={entry.key} fill={CHANNEL_META[entry.key]?.color ?? "#64748b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Status Bölgüsü" description="Kampaniyaların icra vəziyyəti">
          {statusPieData.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusPieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {statusPieData.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_META[entry.key]?.color ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Göndərmə Nəticələri" description="Bütün kampaniyalar üzrə uğurlu / uğursuz mesaj sayı">
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
              <Bar dataKey="sent" name="Göndərilib" fill="#059669" radius={[0, 4, 4, 0]} maxBarSize={28} />
              <Bar dataKey="failed" name="Uğursuz" fill="#dc2626" radius={[0, 4, 4, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <div className="rounded-2xl shadow-sm">
        <p className="px-1 pb-2 text-sm font-semibold">Son Kampaniyalar</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad</TableHead>
              <TableHead>Kanal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Göndərilib / Alıcı</TableHead>
              <TableHead className="text-right">Tarix</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.recentCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  Hələ heç bir kampaniya yaradılmayıb
                </TableCell>
              </TableRow>
            ) : (
              data.recentCampaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-sm font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{CHANNEL_META[c.type]?.label ?? c.type}</TableCell>
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
