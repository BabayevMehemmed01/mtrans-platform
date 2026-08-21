import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MyWorkTabsBar } from "@/components/my-work/MyWorkTabsBar";

export const metadata = {
  title: "Mənim İşim | ERP",
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

// =============================================================================
// My Work — Layout (Teamwork-style module)
// Yalnız sistemə daxil olmuş istifadəçiyə (session.user.id) aid tapşırıqlar
// üzərindən Late / Today / Upcoming statistikaları hesablanır.
// =============================================================================

export default async function MyWorkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const companyId = (session.user as any)?.companyId as string | undefined;

  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      isArchived: false,
      status: { notIn: ["DONE", "CANCELLED"] },
      ...(companyId ? { project: { companyId } } : {}),
    },
    select: { dueDate: true },
  });

  const todayStart = startOfToday();
  const todayEnd = endOfToday();

  let late = 0;
  let today = 0;
  let upcoming = 0;

  for (const task of tasks) {
    if (!task.dueDate) continue;
    const due = new Date(task.dueDate);
    if (due < todayStart) late++;
    else if (due <= todayEnd) today++;
    else upcoming++;
  }

  return (
    <div className="-m-6 flex h-full min-h-0 flex-col">
      <div className="relative z-20 flex-shrink-0">
        <MyWorkTabsBar stats={{ late, today, upcoming }} />
      </div>
      <div className="relative z-0 min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
    </div>
  );
}
