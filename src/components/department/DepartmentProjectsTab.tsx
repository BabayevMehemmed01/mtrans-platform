"use client";

import Link from "next/link";
import { Plus, FolderKanban, Users, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  PLANNING: "Planlanır",
  ACTIVE: "Aktiv",
  ON_HOLD: "Dayandırılıb",
  COMPLETED: "Tamamlandı",
  CANCELLED: "Ləğv edildi",
};

interface DepartmentProjectsTabProps {
  departmentId: string;
  projects: any[];
  canCreateProject: boolean;
}

export function DepartmentProjectsTab({ departmentId, projects, canCreateProject }: DepartmentProjectsTabProps) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">{projects.length} layihə bu şöbəyə aiddir</p>
        {canCreateProject && (
          <Link href={`/dashboard/projects/new?departmentId=${departmentId}`}>
            <Button><Plus className="mr-2 h-4 w-4" /> Yeni Layihə</Button>
          </Link>
        )}
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const color = project.color || "#3b82f6";
            return (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="block group">
                <div className="card-hover flex h-full flex-col overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
                  <div
                    className="relative flex h-32 flex-shrink-0 flex-col justify-between overflow-hidden p-4"
                    style={{ backgroundColor: color }}
                  >
                    <FolderKanban className="absolute -right-4 -bottom-6 h-28 w-28 text-white/10" />
                    <div className="relative flex items-center justify-between">
                      <Badge className="border-white/30 bg-white/20 text-white backdrop-blur-sm">
                        {statusLabels[project.status] ?? project.status}
                      </Badge>
                    </div>
                    <h3 className="relative line-clamp-2 text-xl font-bold text-white drop-shadow-sm">
                      {project.name}
                    </h3>
                  </div>

                  <div className="flex flex-1 flex-col gap-4 p-4">
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarImage src={project.owner.avatar ?? undefined} alt={project.owner.name} />
                        <AvatarFallback>{getInitials(project.owner.name)}</AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm text-muted-foreground">{project.owner.name}</span>
                    </div>

                    <div className="mt-auto flex items-center gap-4 border-t border-[hsl(var(--border))] pt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <CheckSquare className="h-4 w-4" />
                        {project._count.tasks} tapşırıq
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        {project._count.members} üzv
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[hsl(var(--border))] py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FolderKanban className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <h3 className="text-lg font-medium">Layihə Yoxdur</h3>
          <p className="mb-4 text-sm text-muted-foreground">Bu şöbədə hələ heç bir layihə yaradılmayıb.</p>
          {canCreateProject && (
            <Link href={`/dashboard/projects/new?departmentId=${departmentId}`}>
              <Button><Plus className="mr-2 h-4 w-4" /> İlk Layihəni Yarat</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
