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
import { StatCard, ChartCard, EmptyChartState } from "./StatCard";
import type { ReportsInventoryData } from "./types";

const MOVEMENT_META: Record<string, { label: string; color: string }> = {
  INBOUND: { label: "Qəbul", color: "#059669" },
  OUTBOUND: { label: "Satış", color: "#2563eb" },
  TRANSFER: { label: "Transfer", color: "#9333ea" },
  ADJUSTMENT: { label: "Tənzimləmə", color: "#f59e0b" },
  SCRAP: { label: "Silinmə", color: "#dc2626" },
};

function formatMoney(value: number) {
  return value.toLocaleString("az-AZ", { maximumFractionDigits: 0 });
}

export function ReportsInventoryTab({ data }: { data: ReportsInventoryData }) {
  const movementData = data.movementBreakdown
    .map((m) => ({ name: MOVEMENT_META[m.type]?.label ?? m.type, key: m.type, count: m.count }))
    .filter((m) => m.count > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Boxes} label="Cəmi Məhsul" value={data.totalProducts} accent="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={Layers} label="Cəmi Miqdar" value={data.totalQuantity.toLocaleString("az-AZ")} accent="text-purple-600" bg="bg-purple-50" />
        <StatCard icon={TrendingUp} label="Ümumi Dəyər" value={`${formatMoney(data.totalValuation)} AZN`} accent="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={PackageX} label="Aşağı Qalıq" value={data.lowStockCount} accent="text-red-600" bg="bg-red-50" />
        <StatCard icon={Warehouse} label="Anbarlar" value={data.warehouseCount} accent="text-amber-600" bg="bg-amber-50" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Stok Hərəkətləri (30 gün)" description="Son 30 gündə sənəd növü üzrə hərəkət sayı">
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
                    <Cell key={entry.key} fill={MOVEMENT_META[entry.key]?.color ?? "#64748b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Aşağı Qalıqlı Məhsullar" description="Minimum limitə ən yaxın 8 məhsul">
          {data.lowStockItems.length === 0 ? (
            <EmptyChartState label="Aşağı qalıqlı məhsul yoxdur" />
          ) : (
            <div className="max-h-[220px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Məhsul</TableHead>
                    <TableHead className="text-right">Qalıq</TableHead>
                    <TableHead className="text-right">Limit</TableHead>
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
