"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  List,
  LayoutGrid,
  Paperclip,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { TaskListView } from "@/components/project/TaskListView";
import { ProjectDashboard } from "@/components/project/ProjectDashboard";
import { ProjectMembersClient, ProjectMemberExt } from "@/components/project/ProjectMembersClient";
import type { KanbanTask, TaskMember, KanbanLabel } from "@/components/kanban/types";

type TabId = "dashboard" | "list" | "board" | "files" | "members";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "list",      label: "List",      icon: List },
  { id: "board",     label: "Board",     icon: LayoutGrid },
  { id: "members",   label: "Üzvlər/İcazələr", icon: Users },
  { id: "files",     label: "Files",     icon: Paperclip },
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
}: ProjectViewsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("list");
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
      <div className="flex-shrink-0 border-b border-[hsl(var(--border))] bg-white px-6">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all",
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-[hsl(var(--muted-foreground))] hover:text-foreground hover:border-[hsl(var(--border))]"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Tab Content ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "dashboard" && (
          <ProjectDashboard
            tasks={tasks}
            members={members}
            memberCount={memberCount}
          />
        )}

        {activeTab === "list" && (
          <TaskListView
            projectId={projectId}
            tasks={tasks}
            members={members}
            labels={labels}
            onTaskUpdated={handleTaskUpdated}
            onTaskDeleted={handleTaskDeleted}
            onTaskCreated={handleTaskCreated}
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

        {activeTab === "members" && (
          <ProjectMembersClient 
            projectId={projectId} 
            projectMembers={projectMembers} 
            companyUsers={companyUsers} 
          />
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
