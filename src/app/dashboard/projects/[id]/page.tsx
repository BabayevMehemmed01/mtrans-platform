import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import { ProjectViews } from "@/components/project/ProjectViews";
import { canViewProject } from "@/lib/permissions";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ task?: string; tab?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: project?.name ?? "Layihə" };
}

export default async function ProjectDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { task: initialTaskId, tab } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;
  const initialTab = tab || "tasks"; // Default olaraq Tasklar açılır

  // 1. Layihəni və onun daxili məlumatlarını çəkirik
  const project = await prisma.project.findFirst({
    where: { id, companyId },
    include: {
      owner: { select: { id: true, name: true, avatar: true } },
      department: { select: { id: true, name: true } },
      chatChannels: true, // Çat tabı üçün
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, jobTitle: true } },
        },
      },
    },
  });

  if (!project) notFound();
  if (!(await canViewProject(session.user.id, id))) notFound();

  // 2. İstifadəçinin layihədəki rolunu tapırıq
  const currentMember = project.members.find(m => m.userId === session.user.id);
  const isManagerOrOwner = currentMember?.role === "OWNER" || currentMember?.role === "MANAGER";

  // 3. Əgər MANAGER/OWNER-dirsə bütün taskları görür. Əks halda YALNIZ ÖZ tasklarını.
  const taskWhereClause = {
    projectId: id,
    parentId: null,
    isArchived: false,
    ...(isManagerOrOwner ? {} : {
      OR: [
        { assigneeId: session.user.id },
        { createdById: session.user.id }
      ]
    })
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
      select: { id: true, name: true, email: true, avatar: true, jobTitle: true },
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
          initialTaskId={initialTaskId}
          chatChannels={project.chatChannels} // Çat məlumatları
          currentUserRole={currentMember?.role || "VIEWER"} // İcazə yoxlanışı üçün
        />
      </div>
    </div>
  );
}