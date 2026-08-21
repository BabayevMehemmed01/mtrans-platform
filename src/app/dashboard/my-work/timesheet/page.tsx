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
    <div className="flex min-h-[calc(100vh-12rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card md:flex-row">
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-full bg-blue-50 p-4 text-blue-500">
            <Clock3 className="size-10" />
          </div>
          <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-800">
            Let&rsquo;s start building your timesheet
          </h3>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Sağdakı &quot;View tasks&quot; siyahısından bir tapşırığı bura sürüşdürərək
            vaxt qeydinizi yaratmağa başlayın.
          </p>
        </div>
      </div>

      <aside className="flex w-full flex-shrink-0 flex-col border-t border-slate-200 bg-slate-50/50 p-4 dark:border-border dark:bg-muted/30 md:w-80 md:border-t-0 md:border-l">
        <p className="mb-3 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          View tasks
        </p>
        <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
          {tasks.length === 0 ? (
            <p className="px-1 py-8 text-center text-xs text-slate-500">Aktiv tapşırıq yoxdur.</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                draggable
                className="flex cursor-grab items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:cursor-grabbing"
              >
                <GripVertical className="size-3.5 flex-shrink-0 text-slate-400" />
                <span
                  className="size-1.5 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: task.project.color }}
                />
                <span className="min-w-0 flex-1 truncate font-medium text-slate-800">
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
