import {
  addWeeks,
  endOfWeek,
  isBefore,
  isSameDay,
  startOfDay,
  subDays,
} from "date-fns";

export const DEADLINE_COLUMNS = [
  {
    id: "OVERDUE",
    label: "Overdue",
    color: "#ef4444",
    bgColor: "#ef4444/10",
    headerClassName: "text-red-700",
    bodyClassName: "bg-red-50/70 ring-1 ring-red-100",
  },
  {
    id: "DUE_TODAY",
    label: "Due today",
    color: "#22c55e",
    bgColor: "#22c55e/10",
    headerClassName: "text-emerald-700",
    bodyClassName: "bg-emerald-50/70 ring-1 ring-emerald-100",
  },
  {
    id: "DUE_THIS_WEEK",
    label: "Due this week",
    color: "#2563eb",
    bgColor: "#2563eb/10",
    headerClassName: "text-blue-700",
    bodyClassName: "bg-blue-50/70 ring-1 ring-blue-100",
  },
  {
    id: "DUE_NEXT_WEEK",
    label: "Due next week",
    color: "#38bdf8",
    bgColor: "#38bdf8/10",
    headerClassName: "text-sky-700",
    bodyClassName: "bg-sky-50/70 ring-1 ring-sky-100",
  },
  {
    id: "NO_DEADLINE",
    label: "No deadline",
    color: "#94a3b8",
    bgColor: "#94a3b8/10",
    headerClassName: "text-slate-600",
    bodyClassName: "bg-slate-100/70 ring-1 ring-slate-200",
  },
] as const;

export type DeadlineBucket = (typeof DEADLINE_COLUMNS)[number]["id"];

export function getDeadlineBucket(
  dueDate: Date | string | null | undefined,
  now: Date = new Date()
): DeadlineBucket {
  if (!dueDate) return "NO_DEADLINE";

  const due = startOfDay(new Date(dueDate));
  const today = startOfDay(now);

  if (isBefore(due, today)) return "OVERDUE";
  if (isSameDay(due, today)) return "DUE_TODAY";

  const endThisWeek = startOfDay(endOfWeek(today, { weekStartsOn: 1 }));
  if (due <= endThisWeek) return "DUE_THIS_WEEK";

  return "DUE_NEXT_WEEK";
}

/** Deadline sütununa atılan tapşırıq üçün yeni dueDate. */
export function dueDateForBucket(
  bucket: string,
  now: Date = new Date()
): Date | null {
  const today = startOfDay(now);
  switch (bucket) {
    case "OVERDUE":
      return subDays(today, 1);
    case "DUE_TODAY":
      return today;
    case "DUE_THIS_WEEK":
      return startOfDay(endOfWeek(today, { weekStartsOn: 1 }));
    case "DUE_NEXT_WEEK":
      return startOfDay(endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 }));
    case "NO_DEADLINE":
    default:
      return null;
  }
}
