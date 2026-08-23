import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MembersClient } from "./MembersClient";
import type { Metadata } from "next";
import { getTranslation } from "@/lib/i18n"; // YENİ: Tərcümə mühərriki
import { deleteStaleInvites, invitationListInclude } from "@/lib/invites";
import { hasPermission, isSuperAdmin } from "@/lib/permissions";

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

  // YENİ: Hər üzvün iş yükü (aktiv/tamamlanmış tapşırıq sayı) — "Workload" badge-i
  // üçün. Bütün şirkətin tapşırıqları tək sorğu ilə assignee+status üzrə qruplaşdırılır.
  const taskWorkloadAgg = await prisma.task.groupBy({
    by: ["assigneeId", "status"],
    where: { project: { companyId }, isArchived: false, assigneeId: { not: null } },
    _count: true,
  });
  const workloadByUser = new Map<string, { active: number; done: number }>();
  for (const row of taskWorkloadAgg) {
    if (!row.assigneeId) continue;
    const entry = workloadByUser.get(row.assigneeId) ?? { active: 0, done: 0 };
    if (row.status === "DONE") entry.done += row._count;
    else if (row.status !== "CANCELLED") entry.active += row._count;
    workloadByUser.set(row.assigneeId, entry);
  }
  const usersWithWorkload = users.map((u) => ({
    ...u,
    activeTaskCount: workloadByUser.get(u.id)?.active ?? 0,
    completedTaskCount: workloadByUser.get(u.id)?.done ?? 0,
  }));

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

  // TƏHLÜKƏSİZLİK: Server-side hesablanan icazə bayraqları — client komponentə
  // ötürülür ki, düymələr/menyular yalnız faktiki icazəsi olanlara göstərilsin.
  // Real qorunma hər zaman API route-larında təkrar yoxlanılır (bax: /api/members/[id]).
  const superAdmin = await isSuperAdmin(session.user.id);
  const [canAssignRole, canAssignDepartment, canRemoveUser, canInviteUser] = await Promise.all([
    superAdmin || hasPermission(session.user.id, "CAN_ASSIGN_ROLE"),
    superAdmin || hasPermission(session.user.id, "CAN_ASSIGN_DEPARTMENT"),
    superAdmin || hasPermission(session.user.id, "CAN_REMOVE_USER"),
    superAdmin || hasPermission(session.user.id, "CAN_INVITE_USER"),
  ]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("membersPage.title") || "İnsanlar"}
          </h2>
          <p className="text-muted-foreground">
            {t("membersPage.description") || "Şirkətinizə üzvlər əlavə edin, axtarış edin və komandanı idarə edin."}
          </p>
        </div>
      </div>

      <MembersClient
        initialData={usersWithWorkload}
        departments={departments}
        roles={roles}
        projects={projects}
        initialInvites={invites}
        canAssignRole={canAssignRole}
        canAssignDepartment={canAssignDepartment}
        canRemoveUser={canRemoveUser}
        canInviteUser={canInviteUser}
      />
    </div>
  );
}