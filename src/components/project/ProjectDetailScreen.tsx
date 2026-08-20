import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectViews } from "@/components/project/ProjectViews";
import { canViewProject } from "@/lib/permissions";
import { getTranslation } from "@/lib/i18n";

type ProjectKind = "project" | "collab";

interface ProjectDetailScreenProps {
  id: string;
  tab?: string;
  task?: string;
  kind: ProjectKind;
}

function withQuery(path: string, tab?: string, task?: string) {
  const qs = new URLSearchParams();
  if (tab) qs.set("tab", tab);
  if (task) qs.set("task", task);
  const suffix = qs.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export async function generateProjectMetadata(id: string): Promise<Metadata> {
  const session = await auth();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const project = await prisma.project.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: project?.name ?? (t("projectDetail.defaultTitle") || "Layihə") };
}

export async function ProjectDetailScreen({ id, tab, task, kind }: ProjectDetailScreenProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;
  const initialTab = tab || "list";

  const project = await prisma.project.findFirst({
    where: { id, companyId },
    include: {
      owner: { select: { id: true, name: true, avatar: true } },
      department: { select: { id: true, name: true } },
      chatChannels: true,
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, jobTitle: true } },
        },
      },
    },
  });

  if (!project) notFound();
  if (!(await canViewProject(session.user.id, id))) notFound();

  const isCollab = !project.departmentId;
  if (kind === "project" && isCollab) {
    redirect(withQuery(`/dashboard/collab/${id}`, tab, task));
  }
  if (kind === "collab" && !isCollab) {
    redirect(withQuery(`/dashboard/projects/${id}`, tab, task));
  }

  const currentMember = project.members.find((m) => m.userId === session.user.id);
  const isManagerOrOwner = currentMember?.role === "OWNER" || currentMember?.role === "MANAGER";

  const taskWhereClause = {
    projectId: id,
    parentId: null,
    isArchived: false,
    ...(isManagerOrOwner
      ? {}
      : {
          OR: [{ assigneeId: session.user.id }, { createdById: session.user.id }],
        }),
  };

  const [tasks, labels, companyUsers] = await Promise.all([
    prisma.task.findMany({
      where: taskWhereClause,
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        labels: { include: { label: true } },
        _count: { select: { subtasks: true, comments: true, attachments: true } },
      },
    }),
    prisma.label.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { companyId, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        jobTitle: true,
        department: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const memberOptions = project.members.map((m) => ({
    id: m.user.id,
    name: m.user.name ?? "",
    avatar: m.user.avatar,
    jobTitle: m.user.jobTitle,
  }));

  return (
    <div className="flex flex-col h-full -m-6">
      <ProjectHeader
        project={project}
        memberCount={project.members.length}
        taskCount={tasks.length}
      />
      <div className="flex-1 overflow-hidden">
        <ProjectViews
          projectId={id}
          initialTasks={tasks as any}
          members={memberOptions}
          labels={labels}
          taskCount={tasks.length}
          memberCount={project.members.length}
          projectMembers={project.members}
          companyUsers={companyUsers as any}
          initialTab={initialTab as any}
          initialTaskId={task}
          chatChannels={project.chatChannels}
          currentUserRole={currentMember?.role || "VIEWER"}
          isCollab={isCollab}
        />
      </div>
    </div>
  );
}
