import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RolesClient } from "./RolesClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Rollar və İcazələr" };

export default async function RolesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;
  if (!companyId) redirect("/onboarding");

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
          <h2 className="text-2xl font-bold tracking-tight">Rollar və İcazələr</h2>
          <p className="text-[hsl(var(--muted-foreground))]">
            Şirkət daxilindəki rolları və sistemə giriş icazələrini (RBAC) idarə edin.
          </p>
        </div>
      </div>
      
      <RolesClient initialRoles={roles} permissions={permissions} />
    </div>
  );
}
