import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = { title: "Profilim" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

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
        <h2 className="text-2xl font-bold tracking-tight">Profilim</h2>
        <p className="text-[hsl(var(--muted-foreground))]">
          Şəxsi məlumatlarınızı və hesab təhlükəsizliyinizi idarə edin.
        </p>
      </div>
      <ProfileClient user={user} />
    </div>
  );
}
