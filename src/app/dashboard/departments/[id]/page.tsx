import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { isSuperAdmin, isDepartmentHead, hasPermission } from "@/lib/permissions";
import { DepartmentHeader } from "@/components/department/DepartmentHeader";
import { DepartmentTabs } from "@/components/department/DepartmentTabs";
import { getTranslation } from "@/lib/i18n"; // YENİ

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);

  const department = await prisma.department.findUnique({ where: { id }, select: { name: true } });
  return { title: department?.name ?? (t("departmentDetail.defaultTitle") || "Şöbə") };
}

export default async function DepartmentDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const companyId = (session.user as any).companyId;

  const department = await prisma.department.findFirst({
    where: { id, companyId },
    include: {
      head: { select: { id: true, name: true, avatar: true, email: true } },
      _count: { select: { users: true, projects: true } },
    },
  });
  if (!department) notFound();

  const [
    isSuperAdminFlag,
    isHead,
    canEditFull,
    canDeleteFull,
    canCreateProjectGlobal,
    canInviteGlobal,
    members,
    projects,
    tasks,
    allPermissions,
    roles,
  ] = await Promise.all([
    isSuperAdmin(userId),
    isDepartmentHead(userId, id),
    hasPermission(userId, "CAN_EDIT_DEPARTMENT"),
    hasPermission(userId, "CAN_DELETE_DEPARTMENT"),
    hasPermission(userId, "CAN_CREATE_PROJECT"),
    hasPermission(userId, "CAN_INVITE_USER"),
    prisma.user.findMany({
      where: { companyId, departmentId: id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        jobTitle: true,
        status: true,
        role: { select: { id: true, name: true, color: true } },
        extraPermissions: { select: { permission: { select: { key: true, name: true, category: true } } } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      where: { companyId, departmentId: id },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        _count: { select: { tasks: true, members: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.task.findMany({
      where: { project: { companyId, departmentId: id }, isArchived: false },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true, color: true } },
        labels: { include: { label: true } },
        _count: { select: { subtasks: true, comments: true, attachments: true } },
      },
      orderBy: { dueDate: "asc" },
    }),
    prisma.permission.findMany({ orderBy: { category: "asc" } }),
    prisma.role.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        color: true,
        permissions: { select: { permission: { select: { key: true } } } },
      },
    }),
  ]);

  const canManage = isSuperAdminFlag || isHead;
  const canCreateProject = canManage || canCreateProjectGlobal;
  const canInvite = canManage || canInviteGlobal;
  const canEditDescription = canManage || canEditFull;
  const canDelete = canDeleteFull && !department.isDefault;

  return (
    <div className="flex h-full flex-col -m-4 md:-m-8">
      <DepartmentHeader
        department={department}
        canEditDescription={canEditDescription}
        canEditFull={canEditFull}
        canDelete={canDelete}
        isSuperAdmin={isSuperAdminFlag}
      />
      <div className="flex-1 overflow-hidden">
        <DepartmentTabs
          departmentId={id}
          projects={projects as any}
          members={members as any}
          tasks={tasks as any}
          allPermissions={allPermissions}
          roles={roles}
          canManage={canManage}
          canCreateProject={canCreateProject}
          canInvite={canInvite}
          currentUserId={userId}
        />
      </div>
    </div>
  );
}