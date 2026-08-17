"use client";

import { getStatusColor, getPriorityColor } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Users, CheckSquare, Settings, FolderKanban } from "lucide-react";
import { useSession } from "next-auth/react"; // YENİ
import { getTranslation } from "@/lib/i18n"; // YENİ

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

export function ProjectHeader({ project, memberCount, taskCount }: ProjectHeaderProps) {
  // Tərcümə mühərriki
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  // Status etiketlərini daxildə təyin edirik ki, 't' funksiyasını işlədə bilək
  const statusLabels: Record<string, string> = {
    PLANNING: t("projectStatus.PLANNING") || "Planlanır", 
    ACTIVE: t("projectStatus.ACTIVE") || "Aktiv", 
    ON_HOLD: t("projectStatus.ON_HOLD") || "Dayandırılıb",
    COMPLETED: t("projectStatus.COMPLETED") || "Tamamlandı", 
    CANCELLED: t("projectStatus.CANCELLED") || "Ləğv edildi",
  };
  const priorityLabels: Record<string, string> = {
    LOW: t("priority.LOW") || "Aşağı", 
    MEDIUM: t("priority.MEDIUM") || "Orta", 
    HIGH: t("priority.HIGH") || "Yüksək", 
    URGENT: t("priority.URGENT") || "Təcili",
  };

  return (
    <div className="flex-shrink-0 px-6 py-5 border-b border-[hsl(var(--border))] bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Sol Tərəf: Geri düyməsi + Ad + Badgelər */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/projects"
            className="p-1.5 rounded-md border border-[hsl(var(--border))] hover:bg-muted transition-colors text-muted-foreground shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm"
            style={{ backgroundColor: project.color }}
          >
            {project.name.charAt(0).toUpperCase()}
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">{project.name}</h1>
              <div className="hidden sm:flex items-center gap-2">
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${getStatusColor(project.status)}`}>
                  {statusLabels[project.status]}
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${getPriorityColor(project.priority)}`}>
                  {priorityLabels[project.priority]} {t("projectHeader.prioritySuffix") || "Prioritet"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ Tərəf: Ayarlar düyməsi */}
        <div className="flex items-center">
          <Link
            href={`/dashboard/projects/${project.id}/settings`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-white hover:bg-muted text-sm font-medium transition-colors shadow-sm"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
            <span>{t("projectHeader.settings") || "Ayarlar"}</span>
          </Link>
        </div>
      </div>

      {/* Alt Məlumat Sətri (Meta data) */}
      <div className="flex flex-wrap items-center gap-4 mt-3 pl-12 text-xs text-[hsl(var(--muted-foreground))]">
        {project.department && (
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <FolderKanban className="w-3.5 h-3.5 text-blue-500" />
            {project.department.name}
          </span>
        )}
        <div className="w-1 h-1 rounded-full bg-slate-300" />
        <span className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> 
          {(t("projectHeader.peopleCount") || "{count} İnsan").replace("{count}", String(memberCount))}
        </span>
        <div className="w-1 h-1 rounded-full bg-slate-300" />
        <span className="flex items-center gap-1.5">
          <CheckSquare className="w-3.5 h-3.5" /> 
          {(t("projectHeader.taskCount") || "{count} Task").replace("{count}", String(taskCount))}
        </span>
        
        {project.description && (
          <>
            <div className="w-1 h-1 rounded-full bg-slate-300 hidden sm:block" />
            <span className="truncate max-w-md hidden sm:block italic text-slate-500">
              {project.description}
            </span>
          </>
        )}
      </div>
    </div>
  );
}