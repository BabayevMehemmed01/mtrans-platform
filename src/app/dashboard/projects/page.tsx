import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, FolderKanban, Users, CheckSquare, FolderClosed } from "lucide-react";
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

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;

  const projects = await prisma.project.findMany({
    where: { companyId },
    include: {
      owner: true,
      department: { select: { id: true, name: true, color: true } },
      _count: {
        select: { tasks: true, members: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Layihələr</h2>
          <p className="text-muted-foreground">Şirkətinizin layihələrini idarə edin.</p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button><Plus className="mr-2 h-4 w-4" /> Yeni Layihə</Button>
        </Link>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {projects.map((project) => {
            const color = project.color || "#3b82f6";
            return (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="block group"
              >
                <div className="card-hover flex h-full flex-col overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
                  {/* Colored banner (Classroom-style header) */}
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

                  {/* Body */}
                  <div className="flex flex-1 flex-col gap-4 p-4">
                    {project.department ? (
                      <Badge variant="outline" className="w-fit gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: project.department.color }}
                        />
                        {project.department.name}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="w-fit gap-1.5 text-muted-foreground">
                        <FolderClosed className="h-3 w-3" />
                        Şöbə təyin edilməyib
                      </Badge>
                    )}

                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarImage src={project.owner.avatar ?? undefined} alt={project.owner.name} />
                        <AvatarFallback>{getInitials(project.owner.name)}</AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm text-muted-foreground">
                        {project.owner.name}
                      </span>
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
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-[hsl(var(--border))] py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FolderKanban className="h-8 w-8 text-muted-foreground/60" />
          </div>
          <h3 className="text-lg font-medium">Layihə Yoxdur</h3>
          <p className="mb-4 text-sm text-muted-foreground">Hələ heç bir layihə yaratmamısınız.</p>
          <Link href="/dashboard/projects/new">
            <Button><Plus className="mr-2 h-4 w-4" /> İlk Layihəni Yarat</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
