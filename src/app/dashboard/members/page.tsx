import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MembersClient } from "./MembersClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Komanda İdarəetməsi" };

export default async function MembersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;
  if (!companyId) redirect("/onboarding");

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

  const invites = await prisma.invite.findMany({
    where: { companyId },
    include: {
      invitedBy: { select: { id: true, name: true, avatar: true } },
      role: { select: { id: true, name: true, color: true } },
      department: { select: { id: true, name: true, color: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Komanda</h2>
          <p className="text-[hsl(var(--muted-foreground))]">
            Şirkətinizə üzvlər əlavə edin, rollar və şöbələr təyin edin.
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
