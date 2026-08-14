"use client";

import { useState } from "react";
import { FolderKanban, Users, Calendar, LayoutDashboard, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectDashboard } from "@/components/project/ProjectDashboard";
import { WorkCalendar, type CalendarTaskItem } from "@/components/dashboard/WorkCalendar";
import { DepartmentProjectsTab } from "@/components/department/DepartmentProjectsTab";
import { DepartmentPeopleTab } from "@/components/department/DepartmentPeopleTab";
import { DepartmentChatTab } from "@/components/department/DepartmentChatTab";

type TabId = "projects" | "people" | "calendar" | "dashboard" | "chat";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "projects", label: "Layihələr", icon: FolderKanban },
  { id: "people", label: "İnsanlar", icon: Users },
  { id: "calendar", label: "Təqvim", icon: Calendar },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "chat", label: "Qrup Mesajı", icon: MessageSquare },
];

interface DepartmentTabsProps {
  departmentId: string;
  projects: any[];
  members: any[];
  tasks: any[];
  allPermissions: { id: string; key: string; name: string; category: string }[];
  roles: any[];
  canManage: boolean;
  canCreateProject: boolean;
  canInvite: boolean;
  currentUserId: string;
}

export function DepartmentTabs({
  departmentId,
  projects,
  members,
  tasks,
  allPermissions,
  roles,
  canManage,
  canCreateProject,
  canInvite,
  currentUserId,
}: DepartmentTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("projects");

  const calendarTasks: CalendarTaskItem[] = tasks
    .filter((t) => t.dueDate)
    .map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      status: t.status,
      href: `/dashboard/projects/${t.project.id}?task=${t.id}`,
      meta: t.project.name,
    }));

  const dashboardMembers = members.map((m) => ({ id: m.id, name: m.name, avatar: m.avatar, jobTitle: m.jobTitle }));

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
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

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "projects" && (
          <DepartmentProjectsTab departmentId={departmentId} projects={projects} canCreateProject={canCreateProject} />
        )}

        {activeTab === "people" && (
          <DepartmentPeopleTab
            departmentId={departmentId}
            members={members}
            allPermissions={allPermissions}
            roles={roles}
            canManage={canManage}
            canInvite={canInvite}
            currentUserId={currentUserId}
          />
        )}

        {activeTab === "calendar" && (
          <div className="p-6">
            <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-6 max-w-3xl">
              <WorkCalendar tasks={calendarTasks} />
            </div>
          </div>
        )}

        {activeTab === "dashboard" && (
          <ProjectDashboard tasks={tasks} members={dashboardMembers} memberCount={members.length} />
        )}

        {activeTab === "chat" && <DepartmentChatTab departmentId={departmentId} currentUserId={currentUserId} />}
      </div>
    </div>
  );
}
