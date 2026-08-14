import type { AuditAction, EntityType } from "@prisma/client";
import { Activity } from "lucide-react";
import { describeAuditLog } from "@/lib/audit-labels";
import { getInitials, timeAgo } from "@/lib/utils";

export interface ActivityLogItem {
  id: string;
  action: AuditAction;
  entityType: EntityType;
  entityName: string | null;
  createdAt: Date;
  user: { name: string; avatar: string | null } | null;
}

// Server-render oluna bilən komponent — recharts istifadə etmir, ona görə
// "use client" tələb olunmur; sadəcə serverdə əvvəlcədən çəkilmiş məlumatı göstərir.
export function RecentActivityFeed({ logs }: { logs: ActivityLogItem[] }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-[hsl(var(--muted-foreground))]">
        <Activity className="w-8 h-8 opacity-40" />
        <p className="text-sm">Hələ heç bir fəaliyyət qeydə alınmayıb</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[hsl(var(--border))]">
      {logs.map((log) => {
        const userName = log.user?.name ?? "Naməlum istifadəçi";
        return (
          <li key={log.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3">
              {log.user?.avatar ? (
                <img
                  src={log.user.avatar}
                  alt={userName}
                  className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] text-xs font-semibold">
                  {getInitials(userName)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{userName}</span>{" "}
                  <span className="text-[hsl(var(--muted-foreground))]">
                    {describeAuditLog(log)}
                  </span>
                </p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
                  {timeAgo(log.createdAt)}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
