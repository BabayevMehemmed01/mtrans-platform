import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Clock3, GripVertical } from "lucide-react";

export const metadata = {
  title: "My timesheet | My Work | ERP",
};

// =============================================================================
// My Work → My timesheet (dummy/placeholder — Teamwork-style)
// Sağdaki "View tasks" siyahısı yalnız session.user.id-ə aid tapşırıqlardır.
// =============================================================================

export default async function MyWorkTimesheetPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const companyId = (session.user as any)?.companyId as string | undefined;

  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      isArchived: false,
      status: { notIn: ["DONE", "CANCELLED"] },
      ...(companyId ? { project: { companyId } } : {}),
    },
    include: { project: { select: { id: true, name: true, color: true } } },
    orderBy: { updatedAt: "desc" },
    take: 25,
  });

  return (
    <div className="flex h-full flex-col gap-4 md:flex-row">
      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white text-center dark:bg-card">
        <div className="flex size-16 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40">
          <Clock3 className="size-7" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          Let&rsquo;s start building your timesheet
        </h3>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          Sağdakı &quot;View tasks&quot; siyahısından bir tapşırığı bura sürüşdürərək
          vaxt qeydinizi yaratmağa başlayın.
        </p>
      </div>

      <aside className="flex w-full flex-shrink-0 flex-col rounded-xl border border-border bg-white p-3 dark:bg-card md:w-72">
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          View tasks
        </p>
        <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
          {tasks.length === 0 ? (
            <p className="px-1 py-8 text-center text-xs text-muted-foreground">
              Aktiv tapşırıq yoxdur.
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                draggable
                className="flex cursor-grab items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-xs transition-colors hover:bg-muted/60 active:cursor-grabbing"
              >
                <GripVertical className="size-3.5 flex-shrink-0 text-muted-foreground" />
                <span
                  className="size-1.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: task.project.color }}
                />
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                  {task.title}
                </span>
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
