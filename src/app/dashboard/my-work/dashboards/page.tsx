import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CalendarClock, CheckCircle2, Clock3 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MyLoggedTimeChart, type TimeSlice } from "@/components/my-work/MyLoggedTimeChart";
import { format } from "date-fns";

export const metadata = {
  title: "Dashboards | My Work | ERP",
};

const cardSurface = "border border-border bg-white shadow-sm dark:bg-card";

// =============================================================================
// My Work → Dashboards
// Şəxsi widget-lar: Upcoming Events / Logged Time / Active Tasks progress.
// Yalnız session.user.id-ə aid Task məlumatları üzərindən hesablanır.
// =============================================================================

export default async function MyWorkDashboardsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const companyId = (session.user as any)?.companyId as string | undefined;

  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      isArchived: false,
      ...(companyId ? { project: { companyId } } : {}),
    },
    select: {
      id: true,
      title: true,
      status: true,
      dueDate: true,
      actualHours: true,
      estimatedHours: true,
      project: { select: { id: true, name: true, color: true } },
    },
  });

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "DONE").length;
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;

  const now = new Date();
  const upcomingEvents = tasks
    .filter((t) => t.dueDate && new Date(t.dueDate) >= now && t.status !== "DONE" && t.status !== "CANCELLED")
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const timeByProject = new Map<string, TimeSlice>();
  for (const task of tasks) {
    const hours = task.actualHours ?? task.estimatedHours ?? 0;
    if (!hours) continue;
    const existing = timeByProject.get(task.project.id) ?? {
      name: task.project.name,
      color: task.project.color,
      value: 0,
    };
    existing.value += hours;
    timeByProject.set(task.project.id, existing);
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Card className={cardSurface}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <CalendarClock className="size-4 text-muted-foreground" />
            My Upcoming Events
          </CardTitle>
          <CardDescription>Yaxınlaşan son tarixli tapşırıqlarınız.</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Yaxınlaşan hadisə yoxdur.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {upcomingEvents.map((task) => (
                <li key={task.id}>
                  <Link
                    href={`/dashboard/projects/${task.project.id}?task=${task.id}`}
                    className="flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-muted/50"
                  >
                    <span
                      className="size-2 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: task.project.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{task.project.name}</p>
                    </div>
                    <span className="flex-shrink-0 text-[11px] font-medium text-muted-foreground">
                      {format(new Date(task.dueDate!), "dd MMM")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className={cardSurface}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock3 className="size-4 text-muted-foreground" />
            My Logged Time
          </CardTitle>
          <CardDescription>Layihələr üzrə qeydə alınan/proqnozlaşdırılan saatlar.</CardDescription>
        </CardHeader>
        <CardContent>
          <MyLoggedTimeChart data={Array.from(timeByProject.values())} />
        </CardContent>
      </Card>

      <Card className={cardSurface}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="size-4 text-muted-foreground" />
            My Active Tasks
          </CardTitle>
          <CardDescription>Sizə təyin olunmuş tapşırıqların icra faizi.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4">
          <div className="flex items-end justify-between">
            <span className="text-3xl font-semibold tracking-tight">{progressPct}%</span>
            <span className="text-xs text-muted-foreground">
              {done} / {total} tamamlandı
            </span>
          </div>
          <Progress value={progressPct} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{total - done} qalır</span>
            <span>{total} cəmi tapşırıq</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
