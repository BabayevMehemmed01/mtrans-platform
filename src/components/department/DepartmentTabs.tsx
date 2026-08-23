"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react"; // YENİ
import { getTranslation } from "@/lib/i18n"; // YENİ
import { FolderKanban, Users, Calendar, LayoutDashboard, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectDashboard } from "@/components/project/ProjectDashboard";
import { MyWorkCalendarClient, type MyWorkCalendarTask } from "@/components/my-work/MyWorkCalendarClient";
import { DepartmentProjectsTab } from "@/components/department/DepartmentProjectsTab";
import { DepartmentPeopleTab } from "@/components/department/DepartmentPeopleTab";
import { DepartmentChatTab } from "@/components/department/DepartmentChatTab";

type TabId = "projects" | "people" | "calendar" | "dashboard" | "chat";

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
  // YENİ: Tərcümə
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const TABS = useMemo(() => [
    { id: "projects" as TabId,  label: t("departmentTabs.tabProjects") || "Layihələr", icon: FolderKanban },
    { id: "people" as TabId,    label: t("departmentTabs.tabPeople") || "İnsanlar", icon: Users },
    { id: "calendar" as TabId,  label: t("departmentTabs.tabCalendar") || "Təqvim", icon: Calendar },
    { id: "dashboard" as TabId, label: t("departmentTabs.tabDashboard") || "Analitika", icon: LayoutDashboard },
    { id: "chat" as TabId,      label: t("departmentTabs.tabChat") || "Qrup Mesajı", icon: MessageSquare },
  ], [t]);

  const [activeTab, setActiveTab] = useState<TabId>("projects");

  // Departament Təqvimi — "Mənim İşlərim > Təqvimim" ilə EYNİ (100% ortaq)
  // komponentdən istifadə edir, sadəcə bu şöbənin bütün tapşırıqlarını göstərir.
  const calendarTasks: MyWorkCalendarTask[] = tasks
    .filter((t) => t.dueDate)
    .map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate,
      priority: t.priority,
      status: t.status,
      project: {
        id: t.project.id,
        name: t.project.name,
        color: t.project.color ?? "#6366f1",
      },
    }));

  const dashboardMembers = members.map((m) => ({ id: m.id, name: m.name, avatar: m.avatar, jobTitle: m.jobTitle }));

  return (
    <div className="flex flex-col h-full">
      {/* Tab Bar */}
      <div className="flex-shrink-0 border-b border-border bg-card px-6">
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
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
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
            <MyWorkCalendarClient tasks={calendarTasks} />
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