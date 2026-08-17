import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewProjectForm } from "./NewProjectForm";
import { getTranslation } from "@/lib/i18n"; // YENİ

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ departmentId?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;
  if (!companyId) redirect("/onboarding");

  // YENİ: Dili oxuyuruq
  const lang = (session.user as any)?.language || "az";
  const t = getTranslation(lang);

  const { departmentId } = await searchParams;

  const departments = await prisma.department.findMany({
    where: { companyId, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/projects"
          className="p-2 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">
            {t("newProject.title") || "Yeni Layihə"}
          </h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {t("newProject.subtitle") || "Yeni iş layihəsi yaradın"}
          </p>
        </div>
      </div>

      <NewProjectForm departments={departments} defaultDepartmentId={departmentId} />
    </div>
  );
}