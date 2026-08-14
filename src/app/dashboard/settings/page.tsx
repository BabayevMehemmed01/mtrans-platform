import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsClient } from "./SettingsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Parametrlər" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;
  if (!companyId) redirect("/onboarding");

  // Get company info
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      website: true,
      plan: true,
      createdAt: true,
      defaultProjectIds: true,
    }
  });

  if (!company) redirect("/onboarding");

  // Get roles for default role selection (permissions daxil, seçilmiş default rolun
  // hansı icazələrə malik olduğunu bilmək üçün)
  const roles = await prisma.role.findMany({
    where: { companyId },
    include: {
      permissions: {
        include: { permission: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // İcazə qəlibi (permission template) qrid-i üçün bütün icazələr
  const permissions = await prisma.permission.findMany({
    orderBy: [
      { category: "asc" },
      { name: "asc" },
    ],
  });

  // Default layihə girişi checkbox-ları üçün şirkətin aktiv layihələri
  const projects = await prisma.project.findMany({
    where: { companyId, isArchived: false },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Parametrlər</h2>
          <p className="text-[hsl(var(--muted-foreground))]">
            Şirkət məlumatlarını və sistem tənzimləmələrini idarə edin.
          </p>
        </div>
      </div>
      
      <SettingsClient
        initialCompany={company}
        roles={roles}
        permissions={permissions}
        projects={projects}
      />
    </div>
  );
}
