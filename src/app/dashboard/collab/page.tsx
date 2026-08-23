import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getTranslation } from "@/lib/i18n";
import { CollabClient, type CollabListItem } from "./CollabClient";

export default async function CollabPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;
  if (!companyId) redirect("/onboarding");

  const lang = (session.user as any)?.language || "az";
  const t = getTranslation(lang);

  const collabProjects = await prisma.project.findMany({
    where: {
      companyId,
      departmentId: null,
      isArchived: false,
    },
    include: {
      owner: { select: { name: true, avatar: true } },
      members: {
        take: 5,
        select: { user: { select: { id: true, name: true, avatar: true } } },
      },
      tasks: { select: { status: true, isArchived: true } },
      _count: { select: { members: true, tasks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const items: CollabListItem[] = collabProjects.map((project) => {
    const activeTasks = project.tasks.filter((task) => !task.isArchived);
    const doneCount = activeTasks.filter((task) => task.status === "DONE").length;
    const extraMembers = Math.max(0, project._count.members - project.members.length);

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      priority: project.priority,
      color: project.color,
      doneCount,
      taskCount: activeTasks.length,
      memberCount: project._count.members,
      extraMembers,
      members: project.members.map(({ user }) => ({
        id: user.id,
        name: user.name,
        avatar: user.avatar,
      })),
    };
  });

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            {t("collabPage.title") || "Ortaq Layihələr (Collab)"}
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            {t("collabPage.subtitle") || "Fərqli şöbələrdən olan mütəxəssisləri eyni məkanda birləşdirin."}
          </p>
        </div>
        <Link
          href="/dashboard/collab/new"
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all hover:shadow-md"
        >
          <Plus className="w-5 h-5" /> {t("collabPage.newCollabBtn") || "Yeni Collab Layihə"}
        </Link>
      </div>

      <CollabClient
        initialProjects={items}
        statusLabels={{
          PLANNING: t("projectStatus.PLANNING") || "PLANNING",
          ACTIVE: t("projectStatus.ACTIVE") || "ACTIVE",
          ON_HOLD: t("projectStatus.ON_HOLD") || "ON_HOLD",
          COMPLETED: t("projectStatus.COMPLETED") || "COMPLETED",
          CANCELLED: t("projectStatus.CANCELLED") || "CANCELLED",
        }}
        priorityLabels={{
          LOW: t("priority.LOW") || "LOW",
          MEDIUM: t("priority.MEDIUM") || "MEDIUM",
          HIGH: t("priority.HIGH") || "HIGH",
          URGENT: t("priority.URGENT") || "URGENT",
        }}
        membersLabel={t("collabPage.members") || "{count} Üzv"}
        emptyTitle={t("collabPage.emptyTitle") || "Hələ heç bir Collab layihəsi yoxdur"}
        emptyDesc={t("collabPage.emptyDesc") || "Collab yaradaraq müxtəlif şöbələrdən olan komanda yoldaşlarınızı bir yerə toplayın."}
      />
    </div>
  );
}
