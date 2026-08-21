"use client";

import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  LayoutDashboard
} from "lucide-react";
import type { KanbanTask, TaskMember } from "@/components/kanban/types";
import { useSession } from "next-auth/react"; // YENİ
import { getTranslation } from "@/lib/i18n"; // YENİ
import { Card, CardContent } from "@/components/ui/card";
import { toPlannerStatus } from "@/lib/task-status";

interface ProjectDashboardProps {
  tasks: KanbanTask[];
  members: TaskMember[];
  memberCount: number;
}

export function ProjectDashboard({ tasks, members, memberCount }: ProjectDashboardProps) {
  // Tərcümə mühərriki
  const { data: session } = useSession();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const activeTasks = tasks.filter((item) => !item.isArchived);
  const done = activeTasks.filter((item) => toPlannerStatus(item.status) === "DONE").length;
  const inProgress = activeTasks.filter((item) => toPlannerStatus(item.status) === "IN_PROGRESS").length;
  const notPlanned = activeTasks.filter((item) => item.status !== "CANCELLED" && toPlannerStatus(item.status) === "NOT_PLANNED").length;
  const inReview = activeTasks.filter((item) => toPlannerStatus(item.status) === "REVIEW").length;
  const cancelled = activeTasks.filter((item) => item.status === "CANCELLED").length;
  const total = activeTasks.length;
  const activeTotal = total - cancelled;
  const percent = activeTotal > 0 ? Math.round((done / activeTotal) * 100) : 0;

  const overdue = activeTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE"
  ).length;

  const statCards = [
    { label: t("projectDashboard.totalTasks") || "Ümumi Tapşırıq", value: total, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
    { label: t("projectDashboard.completed") || "Tamamlandı", value: done, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 border-green-100" },
    { label: t("projectDashboard.inProgress") || "Davam Edir", value: inProgress, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
    { label: t("projectDashboard.overdue") || "Gecikmiş", value: overdue, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 border-red-100" },
  ];

  return (
    <div className="p-6 overflow-auto h-full max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <LayoutDashboard className="w-5 h-5 text-slate-500" />
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">
          {t("projectDashboard.analytics") || "Layihə Analitikası"}
        </h2>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-700">
            {t("projectDashboard.overallProgress") || "Ümumi Tərəqqi (Progress)"}
          </h3>
          <span className="text-2xl font-black text-blue-600">{percent}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-[13px] font-medium text-slate-500 mt-3">
          {(t("projectDashboard.tasksCompleted") || "{done} / {total} tapşırıq tamamlandı")
            .replace("{done}", String(done))
            .replace("{total}", String(total))}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="bg-white ring-gray-200/80 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className={`w-12 h-12 rounded-xl border ${card.bg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <p className="text-3xl font-black text-slate-800">{card.value}</p>
                <p className="text-[13px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">{card.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Status breakdown & Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-5">
            {t("projectDashboard.statusBreakdown") || "Status Bölgüsü"}
          </h3>
          <div className="space-y-4">
            {[
              { label: t("status.NOT_PLANNED") || "Not Planned", count: notPlanned, color: "#94a3b8" },
              { label: t("status.IN_PROGRESS") || "In Progress", count: inProgress, color: "#f59e0b" },
              { label: t("status.REVIEW") || "Review", count: inReview, color: "#8b5cf6" },
              { label: t("status.DONE") || "Done", count: done, color: "#22c55e" },
              { label: t("status.CANCELLED") || "Cancelled", count: cancelled, color: "#ef4444" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4 group">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                <span className="text-[14px] font-semibold text-slate-700 w-24">{item.label}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: total > 0 ? `${(item.count / total) * 100}%` : "0%",
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <span className="text-[14px] font-bold text-slate-800 w-8 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Members Widget */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-700">
              {t("projectDashboard.activeMembers") || "Aktiv Üzvlər"}
            </h3>
            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">
              {memberCount} {t("projectDashboard.person") || "Nəfər"}
            </span>
          </div>
          <div className="flex-1 space-y-4 overflow-auto max-h-[300px] custom-scrollbar pr-2">
            {members.slice(0, 8).map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-sm font-bold text-blue-700 flex-shrink-0">
                  {m.name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-slate-800 truncate">{m.name}</p>
                  {m.jobTitle && <p className="text-[12px] font-medium text-slate-500 truncate">{m.jobTitle}</p>}
                </div>
              </div>
            ))}
            {memberCount > 8 && (
              <div className="text-center pt-2">
                <p className="text-[12px] font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg inline-block">
                  {(t("projectDashboard.moreMembers") || "+{count} daha çox üzv layihədə iştirak edir").replace("{count}", String(memberCount - 8))}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}