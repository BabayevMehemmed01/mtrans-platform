"use client";

import { getStatusColor, getPriorityColor } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Users, CheckSquare, Settings, Archive } from "lucide-react";

interface ProjectHeaderProps {
  project: {
    id: string;
    name: string;
    description?: string | null;
    color: string;
    status: string;
    priority: string;
    owner: { name?: string | null; avatar?: string | null };
    department?: { name: string } | null;
  };
  memberCount: number;
  taskCount: number;
}

const statusLabels: Record<string, string> = {
  PLANNING: "Planlanır", ACTIVE: "Aktiv", ON_HOLD: "Dayandırılıb",
  COMPLETED: "Tamamlandı", CANCELLED: "Ləğv edildi",
};
const priorityLabels: Record<string, string> = {
  LOW: "Aşağı", MEDIUM: "Orta", HIGH: "Yüksək", URGENT: "Təcili",
};

export function ProjectHeader({ project, memberCount, taskCount }: ProjectHeaderProps) {
  return (
    <div className="flex-shrink-0 px-6 py-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      {/* Back + Title row */}
      <div className="flex items-center gap-3 mb-3">
        <Link
          href="/dashboard/projects"
          className="p-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors text-[hsl(var(--muted-foreground))]"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        {/* Color dot + name */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: project.color }}
        >
          {project.name[0]}
        </div>
        <h1 className="text-lg font-bold truncate flex-1">{project.name}</h1>

        {/* Badges */}
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(project.status)}`}>
          {statusLabels[project.status]}
        </span>
        <span className={`text-xs font-semibold ${getPriorityColor(project.priority)}`}>
          ↑ {priorityLabels[project.priority]}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-5 text-xs text-[hsl(var(--muted-foreground))]">
        {project.description && (
          <span className="truncate max-w-xs">{project.description}</span>
        )}
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" /> {memberCount} üzv
        </span>
        <span className="flex items-center gap-1">
          <CheckSquare className="w-3.5 h-3.5" /> {taskCount} tapşırıq
        </span>
        {project.department && (
          <span>📂 {project.department.name}</span>
        )}
        <span>👤 {project.owner.name}</span>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-2">
          <Link
            href={`/dashboard/projects/${project.id}/settings`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Parametrlər</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
