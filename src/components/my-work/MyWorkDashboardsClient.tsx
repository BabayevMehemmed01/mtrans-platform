"use client";

import Link from "next/link";
import { CalendarClock, CheckCircle2, Clock3, Flag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MyLoggedTimeChart, type TimeSlice } from "@/components/my-work/MyLoggedTimeChart";
import { CustomizeMenu, type CustomizeMenuItem } from "@/components/layout/CustomizeMenu";
import { useCustomization, type VisibilityMap } from "@/hooks/useCustomization";
import { format } from "date-fns";

const PRIORITY_META: Record<string, { label: string; barClass: string; textClass: string }> = {
  URGENT: { label: "Təcili", barClass: "bg-red-500", textClass: "text-red-600 dark:text-red-400" },
  HIGH: { label: "Yüksək", barClass: "bg-orange-500", textClass: "text-orange-600 dark:text-orange-400" },
  MEDIUM: { label: "Orta", barClass: "bg-blue-500", textClass: "text-blue-600 dark:text-blue-400" },
  LOW: { label: "Aşağı", barClass: "bg-muted-foreground/60", textClass: "text-muted-foreground" },
};

const cardSurface =
  "rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md";

const SCOPE = "my-work-dashboard";

const WIDGET_ITEMS: CustomizeMenuItem[] = [
  { key: "upcomingEvents", label: "Yaxınlaşan Hadisələr" },
  { key: "loggedTime", label: "Qeydə Alınan Vaxt" },
  { key: "activeTasks", label: "Aktiv Tapşırıqlarım" },
  { key: "priorityBreakdown", label: "Prioritet Bölgüsü" },
];

type UpcomingEvent = {
  id: string;
  title: string;
  dueDate: string;
  project: { id: string; name: string; color: string };
};

interface MyWorkDashboardsClientProps {
  initialPreferences: VisibilityMap;
  upcomingEvents: UpcomingEvent[];
  timeData: TimeSlice[];
  total: number;
  done: number;
  progressPct: number;
  priorityCounts: { priority: string; count: number }[];
  maxPriorityCount: number;
  activeTaskCount: number;
}

export function MyWorkDashboardsClient({
  initialPreferences,
  upcomingEvents,
  timeData,
  total,
  done,
  progressPct,
  priorityCounts,
  maxPriorityCount,
  activeTaskCount,
}: MyWorkDashboardsClientProps) {
  const { isVisible, setVisible } = useCustomization(SCOPE, initialPreferences);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CustomizeMenu
          items={WIDGET_ITEMS}
          isVisible={isVisible}
          setVisible={setVisible}
          title="Vidjetləri fərdiləşdir"
          triggerLabel="Fərdiləşdir"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {isVisible("upcomingEvents") && (
          <Card className={cardSurface}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CalendarClock className="size-4 text-muted-foreground" />
                Yaxınlaşan Hadisələr
              </CardTitle>
              <CardDescription>Yaxınlaşan son tarixli tapşırıqlarınız.</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Yaxınlaşan hadisə yoxdur.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {upcomingEvents.map((task) => (
                    <li key={task.id}>
                      <Link
                        href={`/dashboard/projects/${task.project.id}?task=${task.id}`}
                        className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent"
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
                          {format(new Date(task.dueDate), "dd MMM")}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {isVisible("loggedTime") && (
          <Card className={cardSurface}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock3 className="size-4 text-muted-foreground" />
                Qeydə Alınan Vaxt
              </CardTitle>
              <CardDescription>Layihələr üzrə qeydə alınan/proqnozlaşdırılan saatlar.</CardDescription>
            </CardHeader>
            <CardContent>
              <MyLoggedTimeChart data={timeData} />
            </CardContent>
          </Card>
        )}

        {isVisible("activeTasks") && (
          <Card className={cardSurface}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="size-4 text-muted-foreground" />
                Aktiv Tapşırıqlarım
              </CardTitle>
              <CardDescription>Sizə təyin olunmuş tapşırıqların icra faizi.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              {total === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Hələ tapşırıq yoxdur.</p>
              ) : (
                <>
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
                </>
              )}
            </CardContent>
          </Card>
        )}

        {isVisible("priorityBreakdown") && (
          <Card className={cardSurface}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Flag className="size-4 text-muted-foreground" />
                Prioritet Bölgüsü
              </CardTitle>
              <CardDescription>Aktiv tapşırıqlarınızın prioritetə görə bölgüsü.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-center gap-3">
              {activeTaskCount === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Aktiv tapşırıq yoxdur.</p>
              ) : (
                priorityCounts.map(({ priority, count }) => {
                  const meta = PRIORITY_META[priority];
                  const pct = Math.round((count / maxPriorityCount) * 100);
                  return (
                    <div key={priority} className="flex items-center gap-3">
                      <span className={`w-14 flex-shrink-0 text-xs font-semibold ${meta.textClass}`}>{meta.label}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${meta.barClass}`}
                          style={{ width: `${count > 0 ? Math.max(pct, 6) : 0}%` }}
                        />
                      </div>
                      <span className="w-4 flex-shrink-0 text-right text-xs font-semibold tabular-nums text-foreground">
                        {count}
                      </span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {!isVisible("upcomingEvents") &&
        !isVisible("loggedTime") &&
        !isVisible("activeTasks") &&
        !isVisible("priorityBreakdown") && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Bütün vidjetlər gizlədilib. Onları geri qaytarmaq üçün yuxarıdakı &quot;Fərdiləşdir&quot; menyusundan istifadə edin.
          </div>
        )}
    </div>
  );
}
