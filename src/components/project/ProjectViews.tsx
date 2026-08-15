"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import type { KanbanTask, TaskMember, KanbanLabel } from "@/components/kanban/types";

// Sənin 9 bəndlik planına uyğun yeni Tab siyahısı
type TabId = "list" | "board" | "calendar" | "members" | "chat" | "dashboard" | "files";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "list",      label: "Tasklar (Siyahı)", icon: List },
  { id: "board",     label: "Lövhə",            icon: LayoutGrid },
  { id: "calendar",  label: "Təqvim",           icon: Calendar },
  { id: "members",   label: "İnsanlar",         icon: Users },
  { id: "chat",      label: "Mesajlar",         icon: MessageCircle },
  { id: "dashboard", label: "Analitika",        icon: LayoutDashboard },
];

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
  // Bayaqkı TS xətasını həll edən yeni prop-lar:
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
  // Səhifə açılanda avtomatik "list" (Tasklar) tabı açılsın
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

        {/* Növbəti addımda quracağımız Təqvim və Çat üçün yer tutucular */}
        {activeTab === "calendar" && (
          <div className="flex flex-col items-center justify-center h-full text-[hsl(var(--muted-foreground))] space-y-4">
            <div className="p-4 bg-muted rounded-full">
              <Calendar className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm font-medium">Təqvim modulu növbəti mərhələdə qurulacaq.</p>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="flex flex-col items-center justify-center h-full text-[hsl(var(--muted-foreground))] space-y-4">
            <div className="p-4 bg-blue-50 rounded-full">
              <MessageCircle className="w-8 h-8 text-blue-500 opacity-80" />
            </div>
            <p className="text-sm font-medium">Layihənin daxili çatı növbəti mərhələdə aktiv olacaq.</p>
          </div>
        )}

        {activeTab === "files" && (
          <div className="flex items-center justify-center h-full text-[hsl(var(--muted-foreground))]">
            <div className="text-center space-y-2">
              <Paperclip className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm">Fayllar modulu tezliklə əlavə olunacaq</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}