"use client";

import {
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import type { KanbanTask, TaskMember } from "@/components/kanban/types";

interface ProjectDashboardProps {
  tasks: KanbanTask[];
  members: TaskMember[];
  memberCount: number;
}

export function ProjectDashboard({ tasks, members, memberCount }: ProjectDashboardProps) {
  const activeTasks = tasks.filter((t) => !t.isArchived);
  const done = activeTasks.filter((t) => t.status === "DONE").length;
  const inProgress = activeTasks.filter((t) => t.status === "IN_PROGRESS").length;
  const todo = activeTasks.filter((t) => t.status === "TODO").length;
  const backlog = activeTasks.filter((t) => t.status === "BACKLOG").length;
  const inReview = activeTasks.filter((t) => t.status === "IN_REVIEW").length;
  const cancelled = activeTasks.filter((t) => t.status === "CANCELLED").length;
  const total = activeTasks.length;
  const activeTotal = total - cancelled;
  const percent = activeTotal > 0 ? Math.round((done / activeTotal) * 100) : 0;

  const overdue = activeTasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE"
  ).length;

  const statCards = [
    { label: "Ümumi Tapşırıq", value: total, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Tamamlandı", value: done, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "Davam Edir", value: inProgress, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Gecikmiş", value: overdue, icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="p-6 overflow-auto h-full">
      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Ümumi Tərəqqi</h3>
          <span className="text-2xl font-bold text-blue-600">{percent}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {done} / {total} tapşırıq tamamlandı
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl border border-[hsl(var(--border))] p-5">
              <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Status Bölgüsü</h3>
          <div className="space-y-3">
            {[
              { label: "Backlog", count: backlog, color: "#94a3b8" },
              { label: "To Do", count: todo, color: "#6366f1" },
              { label: "In Progress", count: inProgress, color: "#f59e0b" },
              { label: "In Review", count: inReview, color: "#8b5cf6" },
              { label: "Done", count: done, color: "#22c55e" },
              { label: "Cancelled", count: cancelled, color: "#ef4444" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-700 flex-1">{item.label}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: total > 0 ? `${(item.count / total) * 100}%` : "0%",
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-6 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[hsl(var(--border))] p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Üzvlər ({memberCount})</h3>
          <div className="space-y-3">
            {members.slice(0, 6).map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-700 flex-shrink-0">
                  {m.name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{m.name}</p>
                  {m.jobTitle && <p className="text-xs text-muted-foreground">{m.jobTitle}</p>}
                </div>
              </div>
            ))}
            {memberCount > 6 && (
              <p className="text-xs text-muted-foreground">+{memberCount - 6} daha çox üzv</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
