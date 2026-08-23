import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RolesClient } from "./RolesClient";
import type { Metadata } from "next";
import { getTranslation } from "@/lib/i18n"; // YENİ: Tərcümə mühərriki
import { hasPermission, hasPermissions, isSuperAdmin } from "@/lib/permissions";
import { AccessDenied } from "@/components/ui/access-denied";

// YENİ: Metadata dinamikləşdirildi
export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);
  return { title: t("rolesPage.metaTitle") || "Rollar və İcazələr" };
}

export default async function RolesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;
  if (!companyId) redirect("/onboarding");

  // YENİ: Dili tapıb tərcümə obyektini formalaşdırırıq
  const lang = (session.user as any)?.language || "az";
  const t = getTranslation(lang);

  // TƏHLÜKƏSİZLİK: Server-side guard — əvvəllər bu səhifə HƏR authenticated
  // istifadəçi üçün açıq idi (yalnız client Sidebar-da gizlədilirdi, real
  // qorunma yox idi). İndi bütün rolların icazə strukturunu görmək üçün
  // ən azı CAN_VIEW_ROLES tələb olunur.
  const superAdmin = await isSuperAdmin(session.user.id);
  const canView = superAdmin || (await hasPermissions(session.user.id, ["CAN_VIEW_ROLES", "CAN_EDIT_ROLE", "CAN_CREATE_ROLE"]));

  if (!canView) {
    return (
      <AccessDenied
        title={t("rolesPage.accessDenied") || "İcazə yoxdur"}
        description={
          t("rolesPage.accessDeniedDesc") ||
          "Rollar və icazələr bölməsinə giriş üçün icazəniz yoxdur."
        }
      />
    );
  }

  const [canCreate, canEdit, canDelete] = await Promise.all([
    superAdmin || hasPermission(session.user.id, "CAN_CREATE_ROLE"),
    superAdmin || hasPermission(session.user.id, "CAN_EDIT_ROLE"),
    superAdmin || hasPermission(session.user.id, "CAN_DELETE_ROLE"),
  ]);

  const roles = await prisma.role.findMany({
    where: { companyId },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
      _count: {
        select: { users: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const permissions = await prisma.permission.findMany({
    orderBy: [
      { category: "asc" },
      { name: "asc" },
    ],
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("rolesPage.title") || "Rollar və İcazələr"}
          </h2>
          <p className="text-muted-foreground">
            {t("rolesPage.description") || "Şirkət daxilindəki rolları və sistemə giriş icazələrini (RBAC) idarə edin."}
          </p>
        </div>
      </div>
      
      <RolesClient
        initialRoles={roles}
        permissions={permissions}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}