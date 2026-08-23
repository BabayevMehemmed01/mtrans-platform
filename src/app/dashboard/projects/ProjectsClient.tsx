"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  FolderKanban,
  CheckSquare,
  FolderClosed,
  Search,
  LayoutGrid,
  List as ListIcon,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, getInitials } from "@/lib/utils";

// =============================================================================
// Layihələr (Projects) — Bitrix/Asana standartlı siyahı + filtrasiya
// Bütün layihələr artıq server-də əvvəlcədən hesablanmış proqres/avatar
// datası ilə gəlir; axtarış, status və arxiv filtrasiyası tam client-side-dır.
// =============================================================================

export interface ProjectListItem {
  id: string;
  name: string;
  status: string;
  color: string;
  isArchived: boolean;
  updatedAt: string;
  owner: { name: string; avatar: string | null };
  department: { id: string; name: string; color: string } | null;
  taskCount: number;
  doneTaskCount: number;
  memberCount: number;
  members: { id: string; name: string; avatar: string | null }[];
  extraMembers: number;
}

interface Translations {
  title: string;
  description: string;
  newProject: string;
  noDepartment: string;
  noProjectsTitle: string;
  noProjectsDesc: string;
  createFirst: string;
  statusLabels: Record<string, string>;
}

const STATUS_FILTERS = ["ALL", "PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;

export function ProjectsClient({
  initialProjects,
  departments,
  translations: t,
}: {
  initialProjects: ProjectListItem[];
  departments: { id: string; name: string; color: string }[];
  translations: Translations;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [departmentId, setDepartmentId] = useState<string>("ALL");
  const [showArchived, setShowArchived] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return initialProjects.filter((project) => {
      if (project.isArchived !== showArchived) return false;
      if (status !== "ALL" && project.status !== status) return false;
      if (departmentId !== "ALL" && project.department?.id !== departmentId) return false;
      if (q && !project.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [initialProjects, query, status, departmentId, showArchived]);

  const archivedCount = initialProjects.filter((p) => p.isArchived).length;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t.title}</h2>
          <p className="text-muted-foreground">{t.description}</p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t.newProject}
          </Button>
        </Link>
      </div>

      {/* ─── Toolbar: axtarış + filtrlər + görünüş dəyişdirici ─── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Layihə axtar..."
            className="h-9 border-none bg-muted/50 pl-9 shadow-none focus-visible:ring-1"
          />
        </div>

        <Select value={status} onValueChange={(v) => v && setStatus(v)}>
          <SelectTrigger className="h-9 w-[150px] border-none bg-muted/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "ALL" ? "Bütün statuslar" : t.statusLabels[s] ?? s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {departments.length > 0 && (
          <Select value={departmentId} onValueChange={(v) => v && setDepartmentId(v)}>
            <SelectTrigger className="h-9 w-[170px] border-none bg-muted/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Bütün şöbələr</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button
          type="button"
          variant={showArchived ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setShowArchived((v) => !v)}
          className="h-9 gap-1.5 text-xs"
        >
          <Archive className="h-3.5 w-3.5" />
          Arxiv {archivedCount > 0 && `(${archivedCount})`}
        </Button>

        <div className="ml-auto flex items-center gap-1 rounded-lg bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => setView("grid")}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              view === "grid" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
            title="Kart görünüşü"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "rounded-md p-1.5 transition-colors",
              view === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
            title="Siyahı görünüşü"
          >
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {filtered.length > 0 ? (
        view === "grid" ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <ProjectGridCard key={project.id} project={project} t={t} />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {filtered.map((project) => (
              <ProjectListRow key={project.id} project={project} t={t} />
            ))}
          </div>
        )
      ) : (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FolderKanban className="h-8 w-8 text-muted-foreground/60" />
          </div>
          {initialProjects.length === 0 ? (
            <>
              <h3 className="text-lg font-medium">{t.noProjectsTitle}</h3>
              <p className="mb-4 text-sm text-muted-foreground">{t.noProjectsDesc}</p>
              <Link href="/dashboard/projects/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> {t.createFirst}
                </Button>
              </Link>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium">Uyğun layihə tapılmadı</h3>
              <p className="text-sm text-muted-foreground">Filtrləri dəyişməyi sınayın.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectAvatars({ project }: { project: ProjectListItem }) {
  return (
    <AvatarGroup>
      {project.members.map((member) => (
        <Avatar key={member.id} size="sm">
          <AvatarImage src={member.avatar ?? undefined} alt={member.name} />
          <AvatarFallback className="text-[10px]">{getInitials(member.name)}</AvatarFallback>
        </Avatar>
      ))}
      {project.extraMembers > 0 && (
        <AvatarGroupCount className="size-6 text-[10px]">+{project.extraMembers}</AvatarGroupCount>
      )}
    </AvatarGroup>
  );
}

function ProjectGridCard({ project, t }: { project: ProjectListItem; t: Translations }) {
  const progressPct = project.taskCount > 0 ? Math.round((project.doneTaskCount / project.taskCount) * 100) : 0;
  const statusLabel = t.statusLabels[project.status] ?? project.status;

  return (
    <Link href={`/dashboard/projects/${project.id}`} className="group block">
      <div className="card-hover flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* Colored banner (Classroom-style header) */}
        <div
          className="relative flex h-32 flex-shrink-0 flex-col justify-between overflow-hidden p-4"
          style={{ backgroundColor: project.color }}
        >
          <FolderKanban className="absolute -right-4 -bottom-6 h-28 w-28 text-white/10" />
          <div className="relative flex items-center justify-between">
            <Badge className="border-white/30 bg-white/20 text-white backdrop-blur-sm">{statusLabel}</Badge>
            {project.isArchived && (
              <Badge className="border-white/30 bg-black/30 text-white backdrop-blur-sm gap-1">
                <Archive className="h-3 w-3" /> Arxiv
              </Badge>
            )}
          </div>
          <h3 className="relative line-clamp-2 text-xl font-bold text-white drop-shadow-sm">{project.name}</h3>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-4 p-4">
          {project.department ? (
            <Badge variant="outline" className="w-fit gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: project.department.color }} />
              {project.department.name}
            </Badge>
          ) : (
            <Badge variant="secondary" className="w-fit gap-1.5 text-muted-foreground">
              <FolderClosed className="h-3 w-3" />
              {t.noDepartment}
            </Badge>
          )}

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-muted-foreground">İcra</span>
              <span className="font-semibold text-foreground">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-1.5" />
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckSquare className="h-4 w-4" />
              {project.doneTaskCount}/{project.taskCount}
            </span>
            {project.members.length > 0 ? (
              <ProjectAvatars project={project} />
            ) : (
              <Avatar size="sm">
                <AvatarImage src={project.owner.avatar ?? undefined} alt={project.owner.name} />
                <AvatarFallback className="text-[10px]">{getInitials(project.owner.name)}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProjectListRow({ project, t }: { project: ProjectListItem; t: Translations }) {
  const progressPct = project.taskCount > 0 ? Math.round((project.doneTaskCount / project.taskCount) * 100) : 0;
  const statusLabel = t.statusLabels[project.status] ?? project.status;

  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="flex items-center gap-4 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-accent"
    >
      <span className="h-9 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{project.name}</p>
          {project.isArchived && (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Archive className="h-3 w-3" /> Arxiv
            </Badge>
          )}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {project.department?.name ?? t.noDepartment}
        </p>
      </div>
      <Badge variant="outline" className="hidden flex-shrink-0 sm:inline-flex">
        {statusLabel}
      </Badge>
      <div className="hidden w-32 flex-shrink-0 items-center gap-2 md:flex">
        <Progress value={progressPct} className="h-1.5" />
        <span className="w-8 flex-shrink-0 text-right text-xs font-semibold text-muted-foreground">
          {progressPct}%
        </span>
      </div>
      <span className="hidden flex-shrink-0 items-center gap-1.5 text-xs text-muted-foreground lg:flex">
        <CheckSquare className="h-3.5 w-3.5" />
        {project.doneTaskCount}/{project.taskCount}
      </span>
      {project.members.length > 0 ? (
        <ProjectAvatars project={project} />
      ) : (
        <Avatar size="sm">
          <AvatarImage src={project.owner.avatar ?? undefined} alt={project.owner.name} />
          <AvatarFallback className="text-[10px]">{getInitials(project.owner.name)}</AvatarFallback>
        </Avatar>
      )}
    </Link>
  );
}
