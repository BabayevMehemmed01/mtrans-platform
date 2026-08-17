"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // YENİ
import { getTranslation } from "@/lib/i18n"; // YENİ
import {
  LayoutDashboard,
  List,
  LayoutGrid,
  Paperclip,
  Users,
  Calendar,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { TaskListView } from "@/components/project/TaskListView";
import { ProjectDashboard } from "@/components/project/ProjectDashboard";
import { ProjectMembersClient, ProjectMemberExt } from "@/components/project/ProjectMembersClient";
import { ProjectCalendar } from "./ProjectCalendar";
import { ProjectChat } from "./ProjectChat";
import type { KanbanTask, TaskMember, KanbanLabel } from "@/components/kanban/types";

type TabId = "list" | "board" | "calendar" | "members" | "chat" | "dashboard" | "files";

interface ProjectViewsProps {
  projectId: string;
  initialTasks: KanbanTask[];
  members: TaskMember[];
  labels: KanbanLabel[];
  taskCount: number;
  memberCount: number;
  projectMembers: ProjectMemberExt[];
  companyUsers: TaskMember[];
  initialTab?: TabId;
  initialTaskId?: string;
  chatChannels?: any[]; 
  currentUserRole?: string; 
}

export function ProjectViews({
  projectId,
  initialTasks,
  members,
  labels,
  taskCount,
  memberCount,
  projectMembers,
  companyUsers,
  initialTab,
  initialTaskId,
  chatChannels,
  currentUserRole,
}: ProjectViewsProps) {
  
  // Tərcümə mühərriki
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  // Tabları lüğətlə (useMemo içində, hər renderdə yenilənməsin deyə) qururuq
  const TABS = useMemo(() => [
    { id: "list" as TabId,      label: t("projectViews.tabList") || "Tasklar (Siyahı)", icon: List },
    { id: "board" as TabId,     label: t("projectViews.tabBoard") || "Lövhə",           icon: LayoutGrid },
    { id: "calendar" as TabId,  label: t("projectViews.tabCalendar") || "Təqvim",       icon: Calendar },
    { id: "members" as TabId,   label: t("projectViews.tabMembers") || "İnsanlar",      icon: Users },
    { id: "chat" as TabId,      label: t("projectViews.tabChat") || "Mesajlar",         icon: MessageCircle },
    { id: "dashboard" as TabId, label: t("projectViews.tabDashboard") || "Analitika",   icon: LayoutDashboard },
    { id: "files" as TabId,     label: t("projectViews.tabFiles") || "Fayllar",         icon: Paperclip },
  ], [t]);

  const [activeTab, setActiveTab] = useState<TabId>(
    initialTab && TABS.some((t) => t.id === initialTab) ? initialTab : "list"
  );
  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);
  const router = useRouter();

  const handleTaskUpdated = useCallback((updatedTask: KanbanTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  }, []);

  const handleTaskDeleted = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const handleTaskCreated = useCallback((newTask: KanbanTask) => {
    setTasks((prev) => [newTask, ...prev]);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* ─── Tab Bar ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-[hsl(var(--border))] bg-white px-6 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-all",
                  isActive
                    ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg"
                    : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-foreground hover:border-[hsl(var(--border))]"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-blue-600" : "")} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Tab Content ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden bg-[hsl(var(--background))]">
        {activeTab === "list" && (
          <TaskListView
            projectId={projectId}
            tasks={tasks}
            members={members}
            labels={labels}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
            onTaskCreated={handleTaskCreated}
            initialTaskId={initialTaskId}
          />
        )}

        {activeTab === "board" && (
          <KanbanBoard
            projectId={projectId}
            initialTasks={tasks}
            members={members}
            labels={labels}
          />
        )}

        {activeTab === "dashboard" && (
          <ProjectDashboard
            tasks={tasks}
            members={members}
            memberCount={memberCount}
          />
        )}

        {activeTab === "members" && (
          <ProjectMembersClient 
            projectId={projectId} 
            projectMembers={projectMembers} 
            companyUsers={companyUsers} 
          />
        )}

        {activeTab === "calendar" && (
          <ProjectCalendar 
            projectId={projectId}
            tasks={tasks} 
            members={members} 
            labels={labels} 
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
            onTaskCreated={handleTaskCreated}
          />
        )}

        {activeTab === "chat" && (
          <ProjectChat 
            projectId={projectId} 
            chatChannels={chatChannels} 
            currentUserRole={currentUserRole} 
          />
        )}

        {activeTab === "files" && (
          <div className="flex items-center justify-center h-full text-[hsl(var(--muted-foreground))]">
            <div className="text-center space-y-2">
              <Paperclip className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm">{t("projectViews.filesWip") || "Fayllar modulu tezliklə əlavə olunacaq"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}