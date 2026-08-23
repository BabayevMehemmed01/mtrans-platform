import { Users, UserCheck, Building2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MemberStatsCardsProps {
  totalMembers: number;
  activeMembers: number;
  departmentCount: number;
  pendingInvitesCount: number;
  t: (key: string) => string;
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  bg,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  accent: string;
  bg: string;
}) {
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
      </CardContent>
    </Card>
  );
}

// =============================================================================
// <MemberStatsCards /> — People/Team səhifəsinin başında komandanın ümumi
// vəziyyətini göstərən statistik kartlar (Cəmi/Aktiv üzv, Şöbə, Gözləyən dəvət).
// =============================================================================
export function MemberStatsCards({
  totalMembers,
  activeMembers,
  departmentCount,
  pendingInvitesCount,
  t,
}: MemberStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        icon={Users}
        label={t("membersClient.statTotal") || "Cəmi Üzv"}
        value={totalMembers}
        accent="text-blue-600"
        bg="bg-blue-50"
      />
      <StatCard
        icon={UserCheck}
        label={t("membersClient.statActive") || "Aktiv Üzv"}
        value={activeMembers}
        accent="text-emerald-600"
        bg="bg-emerald-50"
      />
      <StatCard
        icon={Building2}
        label={t("membersClient.statDepartments") || "Şöbələr"}
        value={departmentCount}
        accent="text-purple-600"
        bg="bg-purple-50"
      />
      <StatCard
        icon={Clock}
        label={t("membersClient.statPendingInvites") || "Gözləyən Dəvət"}
        value={pendingInvitesCount}
        accent="text-amber-600"
        bg="bg-amber-50"
      />
    </div>
  );
}
