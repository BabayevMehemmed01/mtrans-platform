import Link from "next/link";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, getInitials } from "@/lib/utils";

// =============================================================================
// My Work — Task table cells (Teamwork-style "My Tasks" list)
// Server-safe presentational helpers, no client interactivity required.
// =============================================================================

const PRIORITY_STYLES: Record<string, string> = {
  URGENT:
    "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/60",
  HIGH:
    "bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/50",
  MEDIUM:
    "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/50",
  LOW: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
};

const PRIORITY_LABEL: Record<string, string> = {
  URGENT: "Təcili",
  HIGH: "Yüksək",
  MEDIUM: "Orta",
  LOW: "Aşağı",
};

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("border font-medium", PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.LOW)}
    >
      {PRIORITY_LABEL[priority] ?? priority}
    </Badge>
  );
}

export function DueDateCell({
  dueDate,
  overdue,
}: {
  dueDate: Date | string | null;
  overdue?: boolean;
}) {
  if (!dueDate) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "text-xs font-medium tabular-nums",
        overdue ? "text-red-600 dark:text-red-400" : "text-foreground"
      )}
    >
      {format(new Date(dueDate), "dd MMM yyyy")}
    </span>
  );
}

export function AssigneeAvatar({
  assignee,
}: {
  assignee: { id: string; name: string; avatar?: string | null } | null | undefined;
}) {
  if (!assignee) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <div className="flex items-center gap-2">
      <Avatar size="sm">
        <AvatarImage src={assignee.avatar ?? undefined} alt={assignee.name} />
        <AvatarFallback className="text-[10px]">{getInitials(assignee.name)}</AvatarFallback>
      </Avatar>
      <span className="hidden truncate text-xs text-muted-foreground xl:inline">
        {assignee.name}
      </span>
    </div>
  );
}

export function TaskNameCell({
  title,
  href,
  commentCount,
  attachmentCount,
}: {
  title: string;
  href: string;
  commentCount: number;
  attachmentCount: number;
}) {
  return (
    <div className="min-w-0">
      <Link
        href={href}
        className="block truncate text-sm font-medium text-foreground hover:text-primary hover:underline"
      >
        {title}
      </Link>
      {(commentCount > 0 || attachmentCount > 0) && (
        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
          {commentCount > 0 && <span>💬 {commentCount}</span>}
          {attachmentCount > 0 && <span>📎 {attachmentCount}</span>}
        </div>
      )}
    </div>
  );
}

export function ProjectCell({
  project,
}: {
  project: { id: string; name: string; color: string };
}) {
  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
    >
      <span
        className="size-2 flex-shrink-0 rounded-full"
        style={{ backgroundColor: project.color }}
      />
      <span className="truncate">{project.name}</span>
    </Link>
  );
}
