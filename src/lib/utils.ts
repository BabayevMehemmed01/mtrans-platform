import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from "date-fns"
import { az } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const AZ_LOCAL_PREFIXES = ["050", "055", "070", "077", "010"] as const;

/** Infobip və oxşar API-lər üçün nömrəni rəqəmlərə çevirir (məs. 0558087202 → 994558087202). */
export function formatPhoneForAPI(phone: string): string {
  const cleaned = phone.replace(/[\s+()\-]/g, "");
  if (AZ_LOCAL_PREFIXES.some((prefix) => cleaned.startsWith(prefix))) {
    return `994${cleaned.slice(1)}`;
  }
  return cleaned;
}

export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export function getInitials(name: string): string {
  if (!name) return "US";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: az });
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case 'LOW':
      return 'text-muted-foreground bg-muted border-border';
    case 'MEDIUM':
      return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/30 dark:border-blue-900/40';
    case 'HIGH':
      return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-900/40';
    case 'URGENT':
      return 'text-red-600 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/30 dark:border-red-900/40';
    default:
      return 'text-muted-foreground bg-muted border-border';
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'NOT_PLANNED':
    case 'BACKLOG':
    case 'TODO':
      return 'text-muted-foreground bg-muted border-border';
    case 'IN_PROGRESS':
      return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/30 dark:border-blue-900/40';
    case 'REVIEW':
    case 'IN_REVIEW':
      return 'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-950/30 dark:border-purple-900/40';
    case 'DONE':
      return 'text-green-600 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-950/30 dark:border-green-900/40';
    case 'CANCELLED':
      return 'text-red-600 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/30 dark:border-red-900/40';
    default:
      return 'text-muted-foreground bg-muted border-border';
  }
}
