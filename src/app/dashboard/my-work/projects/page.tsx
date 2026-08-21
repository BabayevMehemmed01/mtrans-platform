import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { FolderKanban } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-20 text-center">
        <FolderKanban className="size-10 text-muted-foreground/50" />
        <p className="text-sm font-medium text-foreground">Hələ heç bir layihəyə daxil deyilsiniz.</p>
        <p className="text-xs text-muted-foreground">
          Üzv olduğunuz layihələr burada görünəcək.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => {
        const hasRecentUpdate =
          new Date(project.updatedAt).getTime() - new Date(project.createdAt).getTime() > 60_000;
        const extraMembers = Math.max(0, project._count.members - project.members.length);

        return (
          <div
            key={project.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-card"
          >
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/dashboard/projects/${project.id}`}
                className="flex min-w-0 items-center gap-2"
              >
                <span
                  className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white"
                  style={{ backgroundColor: project.color }}
                >
                  {project.name.substring(0, 2).toUpperCase()}
                </span>
                <span className="truncate text-sm font-semibold text-foreground hover:text-blue-600 hover:underline">
                  {project.name}
                </span>
              </Link>
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

            <p className="text-[11px] text-muted-foreground">
              {hasRecentUpdate ? `Updated ${timeAgo(project.updatedAt)}` : "No recent update"}
            </p>

            <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
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
              <Link
                href={`/dashboard/projects/${project.id}`}
                className="text-[11px] font-medium text-muted-foreground hover:text-blue-600"
              >
                View project →
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
