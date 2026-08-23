import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { addMonths, subMonths } from "date-fns";
import { MyWorkCalendarClient } from "@/components/my-work/MyWorkCalendarClient";

export const metadata = {
  title: "Təqvimim | Mənim İşim | ERP",
};

// =============================================================================
// My Work → My calendar
// Cari tarixdən -6/+6 ay pəncərəsindəki bütün tapşırıqlar bir dəfəyə gətirilir;
// Həftə/Ay arasında keçid və naviqasiya tam client-side (MyWorkCalendarClient)
// idarə olunur ki, naviqasiya səhifə yenilənmədən, ani hiss olunsun.
// =============================================================================

export default async function MyWorkCalendarPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const companyId = (session.user as any)?.companyId as string | undefined;

  const now = new Date();
  const rangeStart = subMonths(now, 6);
  const rangeEnd = addMonths(now, 6);

  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      isArchived: false,
      dueDate: { gte: rangeStart, lte: rangeEnd },
      ...(companyId ? { project: { companyId } } : {}),
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      priority: true,
      status: true,
      project: { select: { id: true, name: true, color: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  const calendarTasks = tasks
    .filter((t) => t.dueDate)
    .map((t) => ({ ...t, dueDate: t.dueDate as Date }));

  return <MyWorkCalendarClient tasks={calendarTasks} />;
}
