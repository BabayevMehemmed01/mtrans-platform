import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PartyPopper } from "lucide-react";
import { MyWorkTasksBoard } from "@/components/my-work/MyWorkTasksBoard";

export const metadata = {
  title: "Tapşırıqlarım | Mənim İşim | ERP",
};

// =============================================================================
// My Work → My tasks
// Yalnız session.user.id-ə assignee kimi təyin edilmiş tapşırıqlar. Qruplaşdırma
// (tarix / prioritet) və render işini client tərəfdə MyWorkTasksBoard idarə edir.
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

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-20 text-center">
        <PartyPopper className="size-10 text-emerald-500" />
        <p className="text-sm font-medium text-foreground">Bütün işləri bitirmisiniz! 🎉</p>
        <p className="text-xs text-muted-foreground">Sizə hələ aktiv tapşırıq təyin edilməyib.</p>
      </div>
    );
  }

  return <MyWorkTasksBoard tasks={tasks} />;
}
