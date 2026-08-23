import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent: string;
  bg: string;
  trend?: string;
}

// =============================================================================
// <StatCard /> — Reports modulunun bütün tablarında (Overview/CRM/Marketing/
// Inventory) istifadə olunan vahid statistik kart görünüşü.
// =============================================================================
export function StatCard({ icon: Icon, label, value, accent, bg, trend }: StatCardProps) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardContent className="flex items-center gap-3 px-4">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", bg)}>
          <Icon className={cn("h-5 w-5", accent)} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold leading-none tracking-tight">{value}</p>
          <p className="truncate text-[11px] text-muted-foreground">{label}</p>
        </div>
        {trend && (
          <span className="ml-auto shrink-0 text-[11px] font-semibold text-emerald-600">{trend}</span>
        )}
      </CardContent>
    </Card>
  );
}

export function ChartCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function EmptyChartState({ label = "Kifayət qədər məlumat yoxdur" }: { label?: string }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{label}</p>;
}
