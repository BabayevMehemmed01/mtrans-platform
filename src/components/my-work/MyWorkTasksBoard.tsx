"use client";

import { useMemo, useState } from "react";
import { CalendarClock, Flag, PartyPopper } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AssigneeAvatar,
  DueDateCell,
  PriorityBadge,
  ProjectCell,
  TaskNameCell,
} from "./TaskCells";

// =============================================================================
// My Work — Tasks board (Teamwork-style), indi "Tarixə görə" / "Prioritetə görə"
// arasında canlı keçid edən dinamik seqment (Shadcn Tabs) ilə.
// =============================================================================

export type MyWorkTaskRow = {
  id: string;
  title: string;
  dueDate: Date | string | null;
  priority: string;
  project: { id: string; name: string; color: string };
  assignee: { id: string; name: string; avatar?: string | null } | null;
  _count: { comments: number; attachments: number };
};

type DateBucket = "late" | "today" | "upcoming" | "noDueDate";
type PriorityBucket = "URGENT" | "HIGH" | "MEDIUM" | "LOW";
type GroupMode = "date" | "priority";

const DATE_GROUP_META: Record<DateBucket, { label: string; dot: string }> = {
  late: { label: "Gecikənlər", dot: "bg-red-500" },
  today: { label: "Bugün", dot: "bg-blue-500" },
  upcoming: { label: "Gələcək", dot: "bg-amber-500" },
  noDueDate: { label: "Tarixi olmayanlar", dot: "bg-muted-foreground" },
};
const DATE_ORDER: DateBucket[] = ["late", "today", "upcoming", "noDueDate"];

const PRIORITY_GROUP_META: Record<PriorityBucket, { label: string; dot: string }> = {
  URGENT: { label: "Təcili", dot: "bg-red-500" },
  HIGH: { label: "Yüksək", dot: "bg-orange-500" },
  MEDIUM: { label: "Orta", dot: "bg-blue-500" },
  LOW: { label: "Aşağı", dot: "bg-muted-foreground" },
};
const PRIORITY_ORDER: PriorityBucket[] = ["URGENT", "HIGH", "MEDIUM", "LOW"];

function dateBucketFor(dueDate: Date | string | null): DateBucket {
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

export function MyWorkTasksBoard({ tasks }: { tasks: MyWorkTaskRow[] }) {
  const [groupBy, setGroupBy] = useState<GroupMode>("date");

  const dateGroups = useMemo(() => {
    const groups: Record<DateBucket, MyWorkTaskRow[]> = {
      late: [],
      today: [],
      upcoming: [],
      noDueDate: [],
    };
    for (const task of tasks) groups[dateBucketFor(task.dueDate)].push(task);
    return groups;
  }, [tasks]);

  const priorityGroups = useMemo(() => {
    const groups: Record<PriorityBucket, MyWorkTaskRow[]> = {
      URGENT: [],
      HIGH: [],
      MEDIUM: [],
      LOW: [],
    };
    for (const task of tasks) {
      const key: PriorityBucket = task.priority in groups ? (task.priority as PriorityBucket) : "LOW";
      groups[key].push(task);
    }
    return groups;
  }, [tasks]);

  const isDateMode = groupBy === "date";
  const order = isDateMode ? DATE_ORDER : PRIORITY_ORDER;
  const groups: Record<string, MyWorkTaskRow[]> = isDateMode ? dateGroups : priorityGroups;
  const meta: Record<string, { label: string; dot: string }> = isDateMode ? DATE_GROUP_META : PRIORITY_GROUP_META;
  const defaultOpen = isDateMode ? ["late", "today"] : ["URGENT", "HIGH"];
  const nonEmptyKeys = order.filter((key) => groups[key].length > 0);

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={groupBy} onValueChange={(value) => setGroupBy(value as GroupMode)}>
          <TabsList>
            <TabsTrigger value="date" className="gap-1.5">
              <CalendarClock className="size-3.5" /> Tarixə görə
            </TabsTrigger>
            <TabsTrigger value="priority" className="gap-1.5">
              <Flag className="size-3.5" /> Prioritetə görə
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <span className="text-xs font-medium text-muted-foreground">
          {tasks.length} aktiv tapşırıq
        </span>
      </div>

      <Accordion key={groupBy} type="multiple" defaultValue={defaultOpen} className="flex flex-col gap-4">
        {nonEmptyKeys.map((key) => {
          const groupMeta = meta[key];
          const groupTasks = groups[key];
          return (
            <AccordionItem
              key={key}
              value={key}
              className="overflow-hidden rounded-xl border border-border shadow-sm transition-all hover:shadow-md"
            >
              <AccordionTrigger className="px-4 py-3.5 hover:bg-accent">
                <span className="inline-flex items-center gap-2">
                  <span className={`size-2 rounded-full ${groupMeta.dot}`} />
                  <span className="text-foreground">{groupMeta.label}</span>
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
                            <DueDateCell dueDate={task.dueDate} overdue={isDateMode && key === "late"} />
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
    </div>
  );
}
