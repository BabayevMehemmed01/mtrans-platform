import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ArrowRight, FolderKanban } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInitials, timeAgo } from "@/lib/utils";
import { ProjectMiniTabs } from "@/components/my-work/ProjectMiniTabs";

export const metadata = {
  title: "My projects | My Work | ERP",
};

const MAX_AVATARS = 5;

// =============================================================================
// My Work → My projects
// Yalnız istifadəçinin (session.user.id) member olduğu layihələr.
// =============================================================================

export default async function MyWorkProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const companyId = (session.user as any)?.companyId as string | undefined;

  const memberships = await prisma.projectMember.findMany({
    where: {
      userId,
      ...(companyId ? { project: { companyId } } : {}),
    },
    select: {
      project: {
        select: {
          id: true,
          name: true,
          description: true,
          color: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { tasks: true, members: true } },
          members: {
            take: MAX_AVATARS,
            select: {
              user: { select: { id: true, name: true, avatar: true } },
            },
          },
        },
      },
    },
    orderBy: { project: { updatedAt: "desc" } },
  });

  const projects = memberships.map((m) => m.project);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 py-20 text-center">
        <FolderKanban className="size-10 text-slate-400" />
        <p className="text-sm font-medium text-slate-500">Hələ heç bir layihəyə daxil deyilsiniz.</p>
        <p className="text-xs text-slate-400">Üzv olduğunuz layihələr burada görünəcək.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => {
        const hasRecentUpdate =
          new Date(project.updatedAt).getTime() - new Date(project.createdAt).getTime() > 60_000;
        const extraMembers = Math.max(0, project._count.members - project.members.length);

        return (
          <article
            key={project.id}
            className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-border dark:bg-card"
          >
            <div
              className="relative h-16 w-full"
              style={{
                background: `linear-gradient(135deg, ${project.color} 0%, ${project.color}cc 100%)`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
            </div>

            <div className="flex flex-1 flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="block truncate text-base font-semibold tracking-tight text-slate-900 hover:text-blue-600 dark:text-foreground"
                  >
                    {project.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {hasRecentUpdate ? `Updated ${timeAgo(project.updatedAt)}` : "No recent update"}
                  </p>
                </div>
                <Badge variant="outline" className="flex-shrink-0 text-[10px] uppercase">
                  {project.status.replace("_", " ")}
                </Badge>
              </div>

              <ProjectMiniTabs
                description={project.description}
                taskCount={project._count.tasks}
                memberCount={project._count.members}
                status={project.status}
              />

              <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 dark:border-border">
                <AvatarGroup>
                  {project.members.map(({ user }) => (
                    <Avatar key={user.id} size="sm">
                      <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
                      <AvatarFallback className="text-[10px]">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  ))}
                  {extraMembers > 0 && (
                    <AvatarGroupCount className="size-6 text-[10px]">+{extraMembers}</AvatarGroupCount>
                  )}
                </AvatarGroup>
                <Button
                  variant="outline"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/dashboard/projects/${project.id}`} />}
                  className="gap-1.5"
                >
                  View project
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
