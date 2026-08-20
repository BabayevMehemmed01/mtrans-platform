import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MembersClient } from "./MembersClient";
import type { Metadata } from "next";
import { getTranslation } from "@/lib/i18n"; // YENİ: Tərcümə mühərriki
import { deleteStaleInvites, invitationListInclude } from "@/lib/invites";

// YENİ: Metadata dinamikləşdirildi
export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);
  return { title: t("membersPage.metaTitle") || "Komanda İdarəetməsi" };
}

export default async function MembersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;
  if (!companyId) redirect("/onboarding");

  // YENİ: Dili tapıb tərcümə obyektini formalaşdırırıq
  const lang = (session.user as any)?.language || "az";
  const t = getTranslation(lang);

  // İşçiləri gətiririk (Şöbə və Rol daxil olmaqla)
  const users = await prisma.user.findMany({
    where: { companyId },
    include: {
      department: true,
      role: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const departments = await prisma.department.findMany({
    where: { companyId, isActive: true },
    orderBy: { name: "asc" },
  });

  const roles = await prisma.role.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });

  const projects = await prisma.project.findMany({
    where: { companyId, isArchived: false },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });

  await deleteStaleInvites(companyId);

  const invites = await prisma.invitation.findMany({
    where: { companyId },
    include: invitationListInclude,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("membersPage.title") || "İnsanlar"}
          </h2>
          <p className="text-[hsl(var(--muted-foreground))]">
            {t("membersPage.description") || "Şirkətinizə üzvlər əlavə edin, axtarış edin və komandanı idarə edin."}
          </p>
        </div>
      </div>

      <MembersClient
        initialData={users}
        departments={departments}
        roles={roles}
        projects={projects}
        initialInvites={invites}
      />
    </div>
  );
}