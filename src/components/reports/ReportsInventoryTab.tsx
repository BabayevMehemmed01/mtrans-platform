"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Boxes, Layers, TrendingUp, PackageX, Warehouse } from "lucide-react";
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
import type { ReportsInventoryData } from "./types";

const MOVEMENT_COLORS: Record<string, string> = {
  INBOUND: "#059669",
  OUTBOUND: "#2563eb",
  TRANSFER: "#9333ea",
  ADJUSTMENT: "#f59e0b",
  SCRAP: "#dc2626",
};

const MOVEMENT_KEYS: Record<string, string> = {
  INBOUND: "reportsPage.inbound",
  OUTBOUND: "reportsPage.outbound",
  TRANSFER: "reportsPage.transfer",
  ADJUSTMENT: "reportsPage.adjustment",
  SCRAP: "reportsPage.scrap",
};

function formatMoney(value: number) {
  return value.toLocaleString("az-AZ", { maximumFractionDigits: 0 });
}

export function ReportsInventoryTab({ data }: { data: ReportsInventoryData }) {
  const t = useT();

  const movementLabel = (type: string) => t(MOVEMENT_KEYS[type] ?? "") || type;

  const movementData = data.movementBreakdown
    .map((m) => ({ name: movementLabel(m.type), key: m.type, count: m.count }))
    .filter((m) => m.count > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Boxes} label={t("reportsPage.totalProducts")} value={data.totalProducts} accent="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={Layers} label={t("reportsPage.totalQuantity")} value={data.totalQuantity.toLocaleString("az-AZ")} accent="text-purple-600" bg="bg-purple-50" />
        <StatCard icon={TrendingUp} label={t("reportsPage.totalValuation")} value={`${formatMoney(data.totalValuation)} AZN`} accent="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={PackageX} label={t("reportsPage.lowStock")} value={data.lowStockCount} accent="text-red-600" bg="bg-red-50" />
        <StatCard icon={Warehouse} label={t("reportsPage.warehouses")} value={data.warehouseCount} accent="text-amber-600" bg="bg-amber-50" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("reportsPage.stockMovements")} description={t("reportsPage.stockMovementsDesc")}>
          {movementData.length === 0 ? (
            <EmptyChartState />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={movementData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={44}>
                  {movementData.map((entry) => (
                    <Cell key={entry.key} fill={MOVEMENT_COLORS[entry.key] ?? "#64748b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title={t("reportsPage.lowStockProducts")} description={t("reportsPage.lowStockProductsDesc")}>
          {data.lowStockItems.length === 0 ? (
            <EmptyChartState label={t("reportsPage.noLowStock")} />
          ) : (
            <div className="max-h-[220px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("reportsPage.product")}</TableHead>
                    <TableHead className="text-right">{t("reportsPage.remaining")}</TableHead>
                    <TableHead className="text-right">{t("reportsPage.limit")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.lowStockItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm font-medium">
                        {item.name}
                        <span className="ml-1.5 text-xs text-muted-foreground">{item.sku}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="rounded-full border-red-200 bg-red-50 px-2 py-0.5 text-red-600">
                          {item.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{item.minStockLimit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
