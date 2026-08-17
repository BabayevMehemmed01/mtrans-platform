import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DepartmentsClient } from "./DepartmentsClient";
import { isSuperAdmin, hasPermission } from "@/lib/permissions";
import type { Metadata } from "next";
import { getTranslation } from "@/lib/i18n"; // YENİ

// YENİ: Metadata dinamik tərcümə edildi
export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);
  return { title: t("departments.title") || "Şöbələr" };
}

export default async function DepartmentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;
  if (!companyId) redirect("/onboarding");

  // YENİ: Tərcümə
  const lang = (session.user as any)?.language || "az";
  const t = getTranslation(lang);

  const [departments, users, canCreate, canEdit, canDelete] = await Promise.all([
    prisma.department.findMany({
      where: { companyId },
      include: {
        head: { select: { id: true, name: true, avatar: true } },
        _count: {
          select: {
            users: true,
            projects: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { companyId },
      select: { id: true, name: true, avatar: true },
      orderBy: { name: "asc" },
    }),
    isSuperAdmin(session.user.id),
    hasPermission(session.user.id, "CAN_EDIT_DEPARTMENT"),
    hasPermission(session.user.id, "CAN_DELETE_DEPARTMENT"),
  ]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t("departments.title") || "Şöbələr"}
          </h2>
          <p className="text-[hsl(var(--muted-foreground))]">
            {t("departments.description") || "Şirkətinizin strukturunu və şöbələrini idarə edin."}
          </p>
        </div>
      </div>

      <DepartmentsClient
        initialData={departments}
        users={users}
        currentUserId={session.user.id}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}