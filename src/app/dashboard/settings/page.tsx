import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SettingsClient } from "./SettingsClient";
import type { Metadata } from "next";
import { getTranslation } from "@/lib/i18n"; // YENİ: Tərcümə mühərriki

export const metadata: Metadata = { title: "Ayarlar | WorkSpace ERP" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;
  if (!companyId) redirect("/onboarding");

  // YENİ: Server Component daxilində dili tapırıq və tərcümə obyektini (t) yaradırıq
  const lang = (session.user as any)?.language || "az";
  const t = getTranslation(lang);

  // 1. Şirkət məlumatlarını çəkirik (Yeni əlavə edilən sütunlarla birlikdə)
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      website: true,
      taxId: true,
      logo: true,
      plan: true,
      createdAt: true,
      defaultProjectIds: true,
      defaultMemberRoleId: true,
      defaultGuestRoleId: true,
    }
  });

  if (!company) redirect("/onboarding");

  // 2. Cari istifadəçinin fərdi ayarlarını (Görünüş, Dil, Wallpaper) çəkirik
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      theme: true,
      language: true,
      wallpaper: true,
    }
  });

  // 3. Rollar (Yeni istifadəçilər üçün default rol seçimi paneli üçün)
  const roles = await prisma.role.findMany({
    where: { companyId },
    include: {
      permissions: {
        include: { permission: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // 4. İcazə qəlibi (permission template) üçün bütün icazələr
  const permissions = await prisma.permission.findMany({
    orderBy: [
      { category: "asc" },
      { name: "asc" },
    ],
  });

  // 5. Default layihə seçimi üçün şirkətin aktiv layihələri
  const projects = await prisma.project.findMany({
    where: { companyId, isArchived: false },
    select: { id: true, name: true, color: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-[1200px] mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col items-start gap-1 mb-2">
        {/* YENİ: "Sistem Ayarları" yazısı tərcüməyə bağlandı */}
        <h2 className="text-[28px] font-black tracking-tight text-slate-800 dark:text-white">
          {t("settings.title") || "Sistem Ayarları"}
        </h2>
        {/* YENİ: Açıqlama mətni tərcüməyə bağlandı */}
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {t("settings.description") || "Görünüş, təhlükəsizlik, icazələr və şirkət tənzimləmələrini buradan idarə edin."}
        </p>
      </div>
      
      <SettingsClient
        initialCompany={company}
        currentUserSettings={currentUser}
        roles={roles}
        permissions={permissions}
        projects={projects}
        userRole={(session.user as any).role}
      />
    </div>
  );
}