import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { ProjectSettingsClient } from "./ProjectSettingsClient";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "Layihə Parametrləri" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectSettingsPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;

  const [project, departments, member, canEditCompanyWide, canDeleteCompanyWide] = await Promise.all([
    prisma.project.findFirst({ where: { id, companyId } }),
    prisma.department.findMany({ where: { companyId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: session.user.id } },
      select: { role: true },
    }),
    hasPermission(session.user.id, "CAN_EDIT_PROJECT"),
    hasPermission(session.user.id, "CAN_DELETE_PROJECT"),
  ]);

  if (!project) notFound();

  const canManage = member?.role === "OWNER" || member?.role === "MANAGER" || canEditCompanyWide;
  const canDelete = member?.role === "OWNER" || canDeleteCompanyWide;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Layihə Parametrləri</h2>
        <p className="text-[hsl(var(--muted-foreground))]">{project.name}</p>
      </div>
      <ProjectSettingsClient project={project} departments={departments} canManage={canManage} canDelete={canDelete} />
    </div>
  );
}
