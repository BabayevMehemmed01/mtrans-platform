"use client";

import { useState, useCallback, useMemo } from "react";
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
import { ProjectFiles } from "./ProjectFiles";
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
  initialTab?: TabId | string;
  initialTaskId?: string;
  chatChannels?: any[]; 
  currentUserRole?: string;
  isCollab?: boolean;
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
  isCollab = false,
}: ProjectViewsProps) {
  
  // Tərcümə mühərriki
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  // Tabları lüğətlə (useMemo içində, hər renderdə yenilənməsin deyə) qururuq
  const TABS = useMemo(() => {
    const tabs = [
      { id: "list" as TabId,      label: t("projectViews.tabList") || "Tasklar (Siyahı)", icon: List },
      { id: "board" as TabId,     label: t("projectViews.tabBoard") || "Lövhə",           icon: LayoutGrid },
      { id: "calendar" as TabId,  label: t("projectViews.tabCalendar") || "Təqvim",       icon: Calendar },
      { id: "members" as TabId,   label: t("projectViews.tabMembers") || "İnsanlar",      icon: Users },
      { id: "chat" as TabId,      label: t("projectViews.tabChat") || "Mesajlar",         icon: MessageCircle },
      { id: "dashboard" as TabId, label: t("projectViews.tabDashboard") || "Analitika",   icon: LayoutDashboard },
      { id: "files" as TabId,     label: t("projectViews.tabFiles") || "Fayllar",         icon: Paperclip },
    ];
    return isCollab ? tabs.filter((tab) => tab.id !== "chat") : tabs;
  }, [t, isCollab]);

  const resolvedInitialTab = useMemo<TabId>(() => {
    const mapped = initialTab === "tasks" ? "list" : initialTab;
    if (mapped && TABS.some((tab) => tab.id === mapped)) return mapped as TabId;
    return "list";
  }, [initialTab, TABS]);

  const [activeTab, setActiveTab] = useState<TabId>(resolvedInitialTab);
  const [tasks, setTasks] = useState<KanbanTask[]>(initialTasks);

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
      <div
        className={cn(
          "flex-1 bg-[hsl(var(--background))]",
          activeTab === "list" || activeTab === "board" || activeTab === "chat"
            ? "overflow-hidden"
            : "overflow-auto"
        )}
      >
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

        {activeTab === "files" && <ProjectFiles projectId={projectId} />}
      </div>
    </div>
  );
}