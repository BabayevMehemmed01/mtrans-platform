import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { Activity, FolderKanban } from "lucide-react";
import { describeAuditLog } from "@/lib/audit-labels";
import { getInitials, timeAgo } from "@/lib/utils";

export const metadata = {
  title: "Activity | My Work | ERP",
};

const OTHER_KEY = "__other__";

// =============================================================================
// My Work → Activity
// Yalnız bu istifadəçinin etdiyi VƏ YA bu istifadəçinin tapşırıqları üzərində
// edilən hərəkətlər (AuditLog). Layihə adlarına görə qruplaşdırılır.
// =============================================================================

export default async function MyWorkActivityPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const companyId = (session.user as any)?.companyId as string | undefined;
  if (!companyId) redirect("/onboarding");

  const myTasks = await prisma.task.findMany({
    where: { assigneeId: userId, project: { companyId } },
    select: {
      id: true,
      project: { select: { id: true, name: true, color: true } },
    },
  });
  const myTaskIds = myTasks.map((t) => t.id);
  const taskProjectMap = new Map(myTasks.map((t) => [t.id, t.project]));

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

  const projectEntityIds = Array.from(
    new Set(logs.filter((l) => l.entityType === "PROJECT").map((l) => l.entityId))
  );
  const projects = projectEntityIds.length
    ? await prisma.project.findMany({
        where: { id: { in: projectEntityIds } },
        select: { id: true, name: true, color: true },
      })
    : [];
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  type Group = { key: string; name: string; color: string; logs: typeof logs };
  const groupMap = new Map<string, Group>();

  for (const log of logs) {
    let project: { id: string; name: string; color: string } | undefined;
    if (log.entityType === "TASK") project = taskProjectMap.get(log.entityId);
    else if (log.entityType === "PROJECT") project = projectMap.get(log.entityId);

    const key = project?.id ?? OTHER_KEY;
    const name = project?.name ?? "Ümumi Fəaliyyət";
    const color = project?.color ?? "#94a3b8";
    const group = groupMap.get(key) ?? { key, name, color, logs: [] as typeof logs };
    group.logs.push(log);
    groupMap.set(key, group);
  }

  const orderedGroups = Array.from(groupMap.values()).sort((a, b) => {
    if (a.key === OTHER_KEY) return 1;
    if (b.key === OTHER_KEY) return -1;
    return b.logs.length - a.logs.length;
  });

  if (orderedGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-20 text-center">
        <Activity className="size-10 text-muted-foreground/50" />
        <p className="text-sm font-medium text-foreground">Hələ heç bir fəaliyyət qeydə alınmayıb.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {orderedGroups.map((group) => (
        <div key={group.key} className="overflow-hidden rounded-xl border border-border bg-white dark:bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-3">
            <span
              className="flex size-6 flex-shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: `${group.color}20`, color: group.color }}
            >
              <FolderKanban className="size-3.5" />
            </span>
            <h3 className="text-sm font-semibold text-foreground">{group.name}</h3>
            <span className="ml-auto text-xs text-muted-foreground">{group.logs.length}</span>
          </div>
          <ul className="divide-y divide-border">
            {group.logs.map((log) => {
              const userName = log.user?.name ?? "Naməlum istifadəçi";
              return (
                <li key={log.id} className="flex items-start gap-3 px-4 py-3">
                  {log.user?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={log.user.avatar}
                      alt={userName}
                      className="size-8 flex-shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {getInitials(userName)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium text-foreground">{userName}</span>{" "}
                      <span className="text-muted-foreground">{describeAuditLog(log)}</span>
                    </p>
                  </div>
                  <span className="flex-shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">
                    {timeAgo(log.createdAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
