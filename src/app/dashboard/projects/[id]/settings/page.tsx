import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProjectSettingsClient } from "./ProjectSettingsClient";
import { hasPermission } from "@/lib/permissions";
import { getTranslation } from "@/lib/i18n"; // YENİ: Tərcümə mühərriki

interface Props {
  params: Promise<{ id: string }>;
}

// YENİ: Brauzer tabındakı adın dinamik tərcüməsi
export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);
  return { title: t("projectSettings.title") || "Layihə Parametrləri" };
}

export default async function ProjectSettingsPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;

  // YENİ: Dili oxuyuruq
  const lang = (session.user as any)?.language || "az";
  const t = getTranslation(lang);

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
  const isCollab = !project.departmentId;
  const backHref = isCollab ? `/dashboard/collab/${project.id}` : `/dashboard/projects/${project.id}`;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-3xl">
      <div className="flex items-start gap-3">
        <Link
          href={backHref}
          className="mt-1 p-2 border border-border rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("projectSettings.title") || "Layihə Parametrləri"}
          </h2>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
      </div>
      <ProjectSettingsClient 
        project={project} 
        departments={departments} 
        canManage={canManage} 
        canDelete={canDelete} 
      />
    </div>
  );
}