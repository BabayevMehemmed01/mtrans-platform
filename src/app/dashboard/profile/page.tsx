import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileClient } from "./ProfileClient";
import type { Metadata } from "next";
import { getTranslation } from "@/lib/i18n"; // YENİ: Tərcümə mühərriki

// YENİ: Metadata dinamik formata çevrildi
export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const lang = (session?.user as any)?.language || "az";
  const t = getTranslation(lang);
  return { title: t("profilePage.metaTitle") || "Profilim" };
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // YENİ: Dili tapıb tərcümə obyektini formalaşdırırıq
  const lang = (session.user as any)?.language || "az";
  const t = getTranslation(lang);

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      jobTitle: true,
      phone: true,
      timezone: true,
      createdAt: true,
      department: { select: { name: true } },
      role: { select: { name: true, color: true } },
      company: { select: { name: true } },
    },
  });
  if (!user) redirect("/login");

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {t("profilePage.title") || "Profilim"}
        </h2>
        <p className="text-[hsl(var(--muted-foreground))]">
          {t("profilePage.description") || "Şəxsi məlumatlarınızı və hesab təhlükəsizliyinizi idarə edin."}
        </p>
      </div>
      <ProfileClient user={user} />
    </div>
  );
}