// =============================================================================
// Kanban shared types
// =============================================================================

export type TaskStatus =
  | "NOT_PLANNED"
  | "IN_PROGRESS"
  | "REVIEW"
  | "DONE"
  | "BACKLOG"
  | "TODO"
  | "IN_REVIEW"
  | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TaskPerson {
  id: string;
  name: string | null;
  avatar?: string | null;
}

export interface KanbanTask {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  dueDate?: Date | string | null;
  estimatedHours?: number | null;
  isArchived?: boolean;
  projectId: string;
  assignee?: TaskPerson | null;
  observers?: TaskPerson[];
  labels: {
    label: KanbanLabel;
  }[];
  _count: {
    subtasks: number;
    comments: number;
    attachments: number;
  };
  createdAt?: Date | string;
}

export interface KanbanColumn {
  id: string;
  label: string;
  color: string;
  bgColor: string;
  headerClassName?: string;
  bodyClassName?: string;
}

export interface TaskMember {
  id: string;
  name: string;
  avatar?: string | null;
  jobTitle?: string | null;
}

export interface KanbanLabel {
  id: string;
  name: string;
  color: string;
}
