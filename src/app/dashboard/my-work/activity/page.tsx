import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { isToday, isYesterday } from "date-fns";
import { Activity } from "lucide-react";
import { describeAuditLog } from "@/lib/audit-labels";
import { getInitials, timeAgo } from "@/lib/utils";

export const metadata = {
  title: "Activity | My Work | ERP",
};

type TimeBucket = "today" | "yesterday" | "older";

const TIME_SECTIONS: { key: TimeBucket; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "older", label: "Older" },
];

function bucketFor(date: Date): TimeBucket {
  if (isToday(date)) return "today";
  if (isYesterday(date)) return "yesterday";
  return "older";
}

// =============================================================================
// My Work → Activity
// Yalnız bu istifadəçinin etdiyi VƏ YA bu istifadəçinin tapşırıqları üzərində
// edilən hərəkətlər (AuditLog). Zamana görə qruplaşdırılır.
// =============================================================================

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

  const groups: Record<TimeBucket, typeof logs> = {
    today: [],
    yesterday: [],
    older: [],
  };

  for (const log of logs) {
    groups[bucketFor(new Date(log.createdAt))].push(log);
  }

  const sections = TIME_SECTIONS.filter((section) => groups[section.key].length > 0);

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 py-20 text-center">
        <Activity className="size-10 text-slate-400" />
        <p className="text-sm font-medium text-slate-500">Hələ heç bir fəaliyyət qeydə alınmayıb.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {sections.map((section) => (
        <section key={section.key} className="mt-6 first:mt-0">
          <h3 className="mb-4 font-semibold text-gray-700">{section.label}</h3>
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:divide-border dark:border-border dark:bg-card">
            {groups[section.key].map((log) => {
              const userName = log.user?.name ?? "Naməlum istifadəçi";
              return (
                <li
                  key={log.id}
                  className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50"
                >
                  {log.user?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={log.user.avatar}
                      alt={userName}
                      className="size-8 flex-shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                      {getInitials(userName)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed">
                      <span className="font-medium text-foreground">{userName}</span>{" "}
                      <span className="text-slate-500">{describeAuditLog(log)}</span>
                    </p>
                  </div>
                  <span className="flex-shrink-0 whitespace-nowrap pt-0.5 text-[11px] text-slate-400">
                    {timeAgo(log.createdAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
