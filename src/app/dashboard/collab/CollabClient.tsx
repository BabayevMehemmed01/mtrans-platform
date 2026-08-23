"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Users, LayoutGrid, CheckSquare, MoreVertical, Pencil, Trash } from "lucide-react";
import { getStatusColor, getPriorityColor, getInitials } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type CollabListItem = {
  id: string;
  name: string;
  status: string;
  priority: string;
  color: string;
  doneCount: number;
  taskCount: number;
  memberCount: number;
  extraMembers: number;
  members: { id: string; name: string; avatar: string | null }[];
};

interface CollabClientProps {
  initialProjects: CollabListItem[];
  statusLabels: Record<string, string>;
  priorityLabels: Record<string, string>;
  membersLabel: string;
  emptyTitle: string;
  emptyDesc: string;
}

function stopCardNav(e: React.SyntheticEvent) {
  e.stopPropagation();
}

export function CollabClient({
  initialProjects,
  statusLabels,
  priorityLabels,
  membersLabel,
  emptyTitle,
  emptyDesc,
}: CollabClientProps) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  const handleDelete = async (e: React.MouseEvent, project: CollabListItem) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`"${project.name}" layihəsini silmək istədiyinizə əminsiniz?`)) return;
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Layihəni silmək mümkün olmadı");
    }
  };

  const handleEdit = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/dashboard/collab/${projectId}/settings`);
  };

  if (projects.length === 0) {
    return (
      <div className="col-span-full bg-card rounded-2xl border border-dashed border-border p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <LayoutGrid className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground">{emptyTitle}</h3>
        <p className="text-sm font-medium text-muted-foreground mt-2 max-w-sm">{emptyDesc}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {projects.map((project) => {
        const progressPct = project.taskCount > 0 ? Math.round((project.doneCount / project.taskCount) * 100) : 0;

        return (
          <div key={project.id} className="relative group">
            <Link href={`/dashboard/collab/${project.id}?tab=list`} className="block">
              <div className="card-hover bg-card rounded-2xl border border-border p-5 hover:border-primary/40 transition-all flex flex-col h-full cursor-pointer">
                <div className="flex items-start justify-between mb-4 pr-8">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                    style={{ backgroundColor: project.color }}
                  >
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${getStatusColor(project.status)}`}>
                      {statusLabels[project.status] || project.status}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${getPriorityColor(project.priority)}`}>
                      {priorityLabels[project.priority] || project.priority}
                    </span>
                  </div>
                </div>

                <h3 className="text-[16px] font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                  {project.name}
                </h3>

                <div className="space-y-1.5 mb-1">
                  <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                    <span>İcra</span>
                    <span className="text-foreground">{progressPct}%</span>
                  </div>
                  <Progress value={progressPct} className="h-1.5" />
                </div>

                <div className="mt-auto pt-4 flex items-center justify-between text-[12px] font-bold text-muted-foreground border-t border-border">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-emerald-500" />
                      {project.doneCount}/{project.taskCount}
                    </span>
                  </div>
                  {project.members.length > 0 ? (
                    <AvatarGroup>
                      {project.members.map((user) => (
                        <Avatar key={user.id} size="sm">
                          <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
                          <AvatarFallback className="text-[9px]">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                      ))}
                      {project.extraMembers > 0 && (
                        <AvatarGroupCount className="size-6 text-[9px]">+{project.extraMembers}</AvatarGroupCount>
                      )}
                    </AvatarGroup>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-primary" />
                      <span>{membersLabel.replace("{count}", String(project.memberCount))}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>

            <div className="absolute top-4 right-4 z-20">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={stopCardNav}>
                  <DropdownMenuItem onClick={(e) => handleEdit(e, project.id)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>Redaktə et</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                    onClick={(e) => { void handleDelete(e, project); }}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    <span>Sil</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
}
