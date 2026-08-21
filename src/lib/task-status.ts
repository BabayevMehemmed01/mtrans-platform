export const TASK_STATUSES = [
  "NOT_PLANNED",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
  "BACKLOG",
  "TODO",
  "IN_REVIEW",
  "CANCELLED",
] as const;

export type TaskStatusValue = (typeof TASK_STATUSES)[number];

export const PLANNER_STATUSES = [
  "NOT_PLANNED",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
] as const;

export type PlannerStatus = (typeof PLANNER_STATUSES)[number];

export const DEFAULT_TASK_STATUS: PlannerStatus = "NOT_PLANNED";

/** Köhnə statusları Planner sütunlarına map edir (mövcud data sınmasın). */
export function toPlannerStatus(status: string): PlannerStatus {
  switch (status) {
    case "IN_PROGRESS":
      return "IN_PROGRESS";
    case "REVIEW":
    case "IN_REVIEW":
      return "REVIEW";
    case "DONE":
      return "DONE";
    default:
      return "NOT_PLANNED";
  }
}

export const PLANNER_COLUMNS = [
  { id: "NOT_PLANNED", label: "Not Planned", color: "#94a3b8", bgColor: "#94a3b8/10" },
  { id: "IN_PROGRESS", label: "In Progress", color: "#f59e0b", bgColor: "#f59e0b/10" },
  { id: "REVIEW", label: "Review", color: "#8b5cf6", bgColor: "#8b5cf6/10" },
  { id: "DONE", label: "Done", color: "#22c55e", bgColor: "#22c55e/10" },
] as const;

export const TASK_STATUS_META: Record<string, { label: string; color: string }> = {
  NOT_PLANNED: { label: "Planlaşdırılmayıb", color: "#94a3b8" },
  IN_PROGRESS: { label: "Davam edir", color: "#f59e0b" },
  REVIEW: { label: "Yoxlanılır", color: "#8b5cf6" },
  DONE: { label: "Tamamlandı", color: "#22c55e" },
  BACKLOG: { label: "Növbəti", color: "#64748b" },
  TODO: { label: "Gözləyir", color: "#6366f1" },
  IN_REVIEW: { label: "Nəzərdən keçirilir", color: "#9333ea" },
  CANCELLED: { label: "Ləğv edildi", color: "#ef4444" },
};
