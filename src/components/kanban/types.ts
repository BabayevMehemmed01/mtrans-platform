// =============================================================================
// Kanban shared types
// =============================================================================

export type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

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
  assignee?: {
    id: string;
    name: string | null;
    avatar?: string | null;
  } | null;
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
