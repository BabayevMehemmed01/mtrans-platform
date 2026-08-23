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
import { Boxes, Layers, PackageX, TrendingUp, Warehouse } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { InventoryCardSkeleton, InventoryEmptyState } from "./InventoryEmptyState";
import type { AnalyticsSnapshot } from "./types";

// =============================================================================
// AnalyticsTab — ABC analizi, stok dövriyyəsi və real-time qalıq göstəriciləri.
// Bütün rəqəmlər /api/inventory/analytics-dən (real Prisma aqreqasiyası) gəlir.
// =============================================================================

const ABC_COLORS: Record<"A" | "B" | "C", string> = { A: "#16a34a", B: "#2563eb", C: "#94a3b8" };

interface AnalyticsTabProps {
  analytics: AnalyticsSnapshot | null;
  loading: boolean;
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", accent)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}

export function AnalyticsTab({ analytics, loading }: AnalyticsTabProps) {
  if (loading || !analytics) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <InventoryCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const { totals, abc, abcSummary, turnover } = analytics;

  if (totals.totalProducts === 0) {
    return (
      <InventoryEmptyState
        icon={TrendingUp}
        title="Analitika üçün məlumat yoxdur"
        description="Məhsul kataloqu və stok hərəkətləri yarandıqdan sonra ABC analizi, dövriyyə və real-time qalıq burada göstəriləcək."
        className="min-h-[45vh]"
      />
    );
  }

  const abcPieData = (["A", "B", "C"] as const)
    .map((cat) => ({ name: cat, value: abcSummary[cat] }))
    .filter((d) => d.value > 0);

  const turnoverChartData = turnover.slice(0, 8).map((t) => ({ name: t.sku, ratio: Number(t.turnoverRatio.toFixed(2)) }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Boxes} label="Total products" value={String(totals.totalProducts)} accent="bg-blue-50 text-blue-600" />
        <StatCard icon={Layers} label="Total quantity" value={totals.totalQuantity.toLocaleString("az-AZ")} accent="bg-purple-50 text-purple-600" />
        <StatCard
          icon={TrendingUp}
          label="Total valuation"
          value={`${totals.totalValuation.toLocaleString("az-AZ", { maximumFractionDigits: 0 })} AZN`}
          accent="bg-emerald-50 text-emerald-600"
        />
        <StatCard icon={PackageX} label="Low stock items" value={String(totals.lowStockCount)} accent="bg-red-50 text-red-600" />
        <StatCard icon={Warehouse} label="Warehouses" value={String(totals.warehouseCount)} accent="bg-amber-50 text-amber-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <p className="mb-1 text-sm font-semibold">ABC Analysis</p>
          <p className="mb-4 text-xs text-muted-foreground">
            Məhsulların dəyər üzrə A (yüksək) / B (orta) / C (aşağı) kateqoriyaları
          </p>
          {abcPieData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Kifayət qədər məlumat yoxdur</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={abcPieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {abcPieData.map((entry) => (
                    <Cell key={entry.name} fill={ABC_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <p className="mb-1 text-sm font-semibold">Stock Turnover (Top 8)</p>
          <p className="mb-4 text-xs text-muted-foreground">Son {analytics.periodDays} gün: OUTBOUND/SCRAP miqdarı ÷ orta qalıq</p>
          {turnoverChartData.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Kifayət qədər məlumat yoxdur</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={turnoverChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip />
                <Bar dataKey="ratio" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-2xl shadow-sm">
        <p className="px-1 pb-2 text-sm font-semibold">ABC Analysis — Detallar</p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>% of total</TableHead>
              <TableHead>Cumulative %</TableHead>
              <TableHead>Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {abc.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  Məlumat yoxdur
                </TableCell>
              </TableRow>
            ) : (
              abc.slice(0, 25).map((row) => (
                <TableRow key={row.productId}>
                  <TableCell className="text-sm font-medium">{row.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.sku}</TableCell>
                  <TableCell className="text-sm">{row.value.toLocaleString("az-AZ", { maximumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.percentOfTotal.toFixed(1)}%</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.cumulativePercent.toFixed(1)}%</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="rounded-full px-2.5 py-1 font-semibold"
                      style={{ color: ABC_COLORS[row.category], borderColor: ABC_COLORS[row.category], backgroundColor: `${ABC_COLORS[row.category]}14` }}
                    >
                      {row.category}
                    </Badge>
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
