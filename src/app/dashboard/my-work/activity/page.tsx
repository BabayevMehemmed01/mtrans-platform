import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { AuditAction, Prisma } from "@prisma/client";
import { format, isToday, isYesterday } from "date-fns";
import { az } from "date-fns/locale";
import {
  Activity,
  Archive,
  CheckCircle2,
  FilePlus2,
  LogIn,
  LogOut,
  Pencil,
  RotateCcw,
  Trash2,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { describeAuditLog } from "@/lib/audit-labels";
import { cn, getInitials, timeAgo } from "@/lib/utils";

export const metadata = {
  title: "Fəaliyyət | Mənim İşim | ERP",
};

// =============================================================================
// My Work → Activity (Fəaliyyət)
// Yalnız bu istifadəçinin etdiyi VƏ YA bu istifadəçinin tapşırıqları üzərində
// edilən hərəkətlər (AuditLog). Günlərə görə şaquli xətli Timeline formatında
// göstərilir — Təqvim/Timeline dizaynına uyğun, hər gün öz bölməsində.
// =============================================================================

const ACTION_META: Record<AuditAction, { icon: typeof Activity; className: string }> = {
  CREATE: { icon: FilePlus2, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  UPDATE: { icon: Pencil, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  DELETE: { icon: Trash2, className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  LOGIN: { icon: LogIn, className: "bg-slate-500/10 text-slate-600 dark:text-slate-400" },
  LOGOUT: { icon: LogOut, className: "bg-slate-500/10 text-slate-600 dark:text-slate-400" },
  INVITE: { icon: UserPlus, className: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  ASSIGN: { icon: UserCheck, className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  COMPLETE: { icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  ARCHIVE: { icon: Archive, className: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400" },
  RESTORE: { icon: RotateCcw, className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
};

function ActionIcon({ action }: { action: AuditAction }) {
  const meta = ACTION_META[action] ?? { icon: Activity, className: "bg-muted text-muted-foreground" };
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "relative z-10 flex size-8 flex-shrink-0 items-center justify-center rounded-full ring-4 ring-background",
        meta.className
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

export default async function MyWorkActivityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const companyId = (session.user as any)?.companyId as string | undefined;
  if (!companyId) redirect("/onboarding");

  const myTasks = await prisma.task.findMany({
    where: { assigneeId: userId, project: { companyId } },
    select: { id: true },
  });
  const myTaskIds = myTasks.map((t) => t.id);

  const orConditions: Prisma.AuditLogWhereInput[] = [{ userId }];
  if (myTaskIds.length > 0) {
    orConditions.push({ entityType: "TASK", entityId: { in: myTaskIds } });
  }

  const logs = await prisma.auditLog.findMany({
    where: { companyId, OR: orConditions },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
    take: 150,
  });

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-20 text-center">
        <Activity className="size-10 text-muted-foreground/60" />
        <p className="text-sm font-medium text-muted-foreground">Hələ heç bir fəaliyyət qeydə alınmayıb.</p>
      </div>
    );
  }

  // Hər təqvim gününü ayrıca bölmə halına salırıq (Bugün / Dünən / tarix).
  const dayOrder: string[] = [];
  const dayMap = new Map<string, typeof logs>();
  for (const log of logs) {
    const key = format(new Date(log.createdAt), "yyyy-MM-dd");
    if (!dayMap.has(key)) {
      dayMap.set(key, []);
      dayOrder.push(key);
    }
    dayMap.get(key)!.push(log);
  }

  const dayGroups = dayOrder.map((key) => {
    const dayLogs = dayMap.get(key)!;
    const date = new Date(dayLogs[0].createdAt);
    const label = isToday(date)
      ? "Bugün"
      : isYesterday(date)
        ? "Dünən"
        : format(date, "d MMMM, EEEE", { locale: az });
    return { key, label, logs: dayLogs };
  });

  return (
    <div className="flex flex-col gap-8 pb-4">
      {dayGroups.map((day) => (
        <section key={day.key}>
          <div className="sticky top-0 z-20 mb-4 flex items-center gap-3 bg-background/95 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <span className="flex h-7 items-center rounded-full bg-primary px-3 text-[11px] font-bold uppercase tracking-wide text-primary-foreground capitalize">
              {day.label}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {day.logs.length} hərəkət
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <ol className="relative ml-4 space-y-4 border-l-2 border-border pl-8">
            {day.logs.map((log) => {
              const userName = log.user?.name ?? "Naməlum istifadəçi";
              return (
                <li key={log.id} className="relative">
                  <span className="absolute -left-[41px] top-0">
                    <ActionIcon action={log.action} />
                  </span>
                  <div className="rounded-xl border border-border bg-card p-3.5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        {log.user?.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={log.user.avatar}
                            alt={userName}
                            className="size-7 flex-shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                            {getInitials(userName)}
                          </div>
                        )}
                        <p className="min-w-0 text-sm leading-relaxed">
                          <span className="font-semibold text-foreground">{userName}</span>{" "}
                          <span className="text-muted-foreground">{describeAuditLog(log)}</span>
                        </p>
                      </div>
                      <span
                        className="flex-shrink-0 whitespace-nowrap pt-0.5 text-[11px] text-muted-foreground/70"
                        title={timeAgo(log.createdAt)}
                      >
                        {format(new Date(log.createdAt), "HH:mm")}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
