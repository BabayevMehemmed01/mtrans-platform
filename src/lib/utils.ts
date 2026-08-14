import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from "date-fns"
import { az } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
      return 'text-slate-500 bg-slate-100 border-slate-200';
    case 'MEDIUM':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'HIGH':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'URGENT':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-slate-500 bg-slate-100 border-slate-200';
  }
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'TODO':
      return 'text-slate-600 bg-slate-100 border-slate-200';
    case 'IN_PROGRESS':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'REVIEW':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    case 'DONE':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-slate-600 bg-slate-100 border-slate-200';
  }
}
