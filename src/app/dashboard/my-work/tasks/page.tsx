import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PartyPopper } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AssigneeAvatar,
  DueDateCell,
  PriorityBadge,
  ProjectCell,
  TaskNameCell,
} from "@/components/my-work/TaskCells";

export const metadata = {
  title: "Tapşırıqlarım | Mənim İşim | ERP",
};

type Bucket = "late" | "today" | "upcoming" | "noDueDate";

const GROUP_META: Record<Bucket, { label: string; dot: string }> = {
  late: { label: "Gecikənlər", dot: "bg-red-500" },
  today: { label: "Bugün", dot: "bg-blue-500" },
  upcoming: { label: "Gələcək", dot: "bg-amber-500" },
  noDueDate: { label: "Tarixi olmayanlar", dot: "bg-gray-400" },
};

const GROUP_ORDER: Bucket[] = ["late", "today", "upcoming", "noDueDate"];

function bucketFor(dueDate: Date | string | null): Bucket {
  if (!dueDate) return "noDueDate";
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  const due = new Date(dueDate);
  if (due < todayStart) return "late";
  if (due <= todayEnd) return "today";
  return "upcoming";
}

// =============================================================================
// My Work → My tasks
// Yalnız session.user.id-ə assignee kimi təyin edilmiş tapşırıqlar.
// =============================================================================

export default async function MyWorkTasksPage() {
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
    include: {
      project: { select: { id: true, name: true, color: true } },
      assignee: { select: { id: true, name: true, avatar: true } },
      _count: { select: { comments: true, attachments: true } },
    },
    orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
  });

  const groups: Record<Bucket, typeof tasks> = {
    late: [],
    today: [],
    upcoming: [],
    noDueDate: [],
  };

  for (const task of tasks) {
    groups[bucketFor(task.dueDate)].push(task);
  }

  const nonEmptyGroups = GROUP_ORDER.filter((key) => groups[key].length > 0);
  const defaultOpen = GROUP_ORDER.filter((key) => key === "late" || key === "today");

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-20 text-center">
        <PartyPopper className="size-10 text-emerald-500" />
        <p className="text-sm font-medium text-foreground">Bütün işləri bitirmisiniz! 🎉</p>
        <p className="text-xs text-muted-foreground">Sizə hələ aktiv tapşırıq təyin edilməyib.</p>
      </div>
    );
  }

  return (
    <Accordion type="multiple" defaultValue={defaultOpen} className="flex flex-col gap-4">
      {nonEmptyGroups.map((key) => {
        const meta = GROUP_META[key];
        const groupTasks = groups[key];
        return (
          <AccordionItem
            key={key}
            value={key}
            className="overflow-hidden rounded-xl border border-border shadow-sm transition-all hover:shadow-md"
          >
            <AccordionTrigger className="px-4 py-3.5 hover:bg-accent">
              <span className="inline-flex items-center gap-2">
                <span className={`size-2 rounded-full ${meta.dot}`} />
                <span className="text-foreground">{meta.label}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {groupTasks.length}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="overflow-hidden">
                <table className="w-full caption-bottom text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="h-11 bg-muted/50 px-4 text-left align-middle text-xs font-medium text-muted-foreground">
                        Tapşırıq
                      </th>
                      <th className="h-11 bg-muted/50 px-4 text-left align-middle text-xs font-medium text-muted-foreground">
                        Məsul şəxs
                      </th>
                      <th className="h-11 bg-muted/50 px-4 text-left align-middle text-xs font-medium text-muted-foreground">
                        Son tarix
                      </th>
                      <th className="h-11 bg-muted/50 px-4 text-left align-middle text-xs font-medium text-muted-foreground">
                        Prioritet
                      </th>
                      <th className="h-11 bg-muted/50 px-4 text-left align-middle text-xs font-medium text-muted-foreground">
                        Layihə
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {groupTasks.map((task) => (
                      <tr key={task.id} className="transition-colors hover:bg-accent/50">
                        <td className="px-4 py-3 align-middle">
                          <TaskNameCell
                            title={task.title}
                            href={`/dashboard/projects/${task.project.id}?task=${task.id}`}
                            commentCount={task._count.comments}
                            attachmentCount={task._count.attachments}
                          />
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <AssigneeAvatar assignee={task.assignee} />
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <DueDateCell dueDate={task.dueDate} overdue={key === "late"} />
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <PriorityBadge priority={task.priority} />
                        </td>
                        <td className="px-4 py-3 align-middle">
                          <ProjectCell project={task.project} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
