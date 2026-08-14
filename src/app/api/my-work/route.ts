import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"];

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    
    const userId = session.user.id;
    const companyId = (session.user as any).companyId;

    if (!companyId) return new NextResponse("Company Required", { status: 400 });

    // 1. Get assigned tasks
    const tasks = await prisma.task.findMany({
      where: { assigneeId: userId, project: { companyId } },
      include: {
        project: { select: { id: true, name: true, color: true } },
        labels: { include: { label: true } }
      },
      orderBy: { dueDate: "asc" }
    });

    // 2. Get recent comments on my tasks
    const recentComments = await prisma.comment.findMany({
      where: {
        task: { assigneeId: userId }
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        task: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    // 3. Deadline stats
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);

    const isOpen = (t: { status: string }) => t.status !== "DONE" && t.status !== "CANCELLED";
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && isOpen(t));
    const upcoming = tasks.filter(t => t.dueDate && new Date(t.dueDate) >= now && new Date(t.dueDate) <= threeDaysFromNow && isOpen(t));

    // 4. Son 7 gün üzrə tamamlanan tapşırıq trendi (öz tapşırıqları)
    const WEEK_DAYS = 7;
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - (WEEK_DAYS - 1));

    const completedThisWeek = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        project: { companyId },
        completedAt: { gte: weekStart },
      },
      select: { completedAt: true },
    });

    const weeklyBuckets = new Map<string, number>();
    for (let i = 0; i < WEEK_DAYS; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      weeklyBuckets.set(key, 0);
    }
    for (const t of completedThisWeek) {
      if (!t.completedAt) continue;
      const key = new Date(t.completedAt).toISOString().slice(0, 10);
      if (weeklyBuckets.has(key)) weeklyBuckets.set(key, (weeklyBuckets.get(key) ?? 0) + 1);
    }
    const weeklyCompleted = Array.from(weeklyBuckets, ([iso, count]) => {
      const [, month, day] = iso.split("-");
      return { date: `${day}.${month}`, count };
    });

    return NextResponse.json({
      tasks,
      recentComments,
      stats: {
        overdue: overdue.length,
        upcoming: upcoming.length,
        total: tasks.length,
        completed: tasks.filter(t => t.status === "DONE").length
      },
      weeklyCompleted
    });
  } catch (error) {
    console.error("[MY_WORK_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    
    const body = await req.json();
    const { taskId, status } = body;

    if (!VALID_STATUSES.includes(status)) {
      return new NextResponse("Invalid status", { status: 400 });
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task || task.assigneeId !== session.user.id) {
      return new NextResponse("Forbidden or Not Found", { status: 403 });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: status === "DONE" ? new Date() : status !== task.status ? null : task.completedAt,
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("[MY_WORK_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
