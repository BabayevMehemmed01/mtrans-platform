import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTranslation } from "@/lib/i18n"; // YENİ: Tərcümə mühərriki gətirildi
import { ProjectsClient, type ProjectListItem } from "./ProjectsClient";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;

  // YENİ: Dili oxuyub tərcümə obyektini (t) qururuq
  const lang = (session.user as any)?.language || "az";
  const t = getTranslation(lang);

  const [projects, departments] = await Promise.all([
    prisma.project.findMany({
      where: { companyId },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        department: { select: { id: true, name: true, color: true } },
        members: {
          take: 5,
          select: { user: { select: { id: true, name: true, avatar: true } } },
        },
        tasks: { select: { status: true, isArchived: true } },
        _count: { select: { tasks: true, members: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.department.findMany({
      where: { companyId },
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Server tərəfdə hər layihə üçün icra faizini (progress) hesablayırıq —
  // Prisma-nın tək relation üzrə iki fərqli filtrlə saya bilmədiyi üçün
  // tam status siyahısı çəkilib JS tərəfində aqreqasiya olunur.
  const items: ProjectListItem[] = projects.map((project) => {
    const activeTasks = project.tasks.filter((task) => !task.isArchived);
    const doneCount = activeTasks.filter((task) => task.status === "DONE").length;
    const extraMembers = Math.max(0, project._count.members - project.members.length);

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      color: project.color || "#3b82f6",
      isArchived: project.isArchived,
      updatedAt: project.updatedAt.toISOString(),
      owner: { name: project.owner.name, avatar: project.owner.avatar },
      department: project.department
        ? { id: project.department.id, name: project.department.name, color: project.department.color }
        : null,
      taskCount: activeTasks.length,
      doneTaskCount: doneCount,
      memberCount: project._count.members,
      members: project.members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        avatar: m.user.avatar,
      })),
      extraMembers,
    };
  });

  return (
    <ProjectsClient
      initialProjects={items}
      departments={departments}
      translations={{
        title: t("projectsPage.title") || "Layihələr",
        description: t("projectsPage.description") || "Şirkətinizin layihələrini idarə edin.",
        newProject: t("projectsPage.newProject") || "Yeni Layihə",
        noDepartment: t("projectsPage.noDepartment") || "Şöbə təyin edilməyib",
        noProjectsTitle: t("projectsPage.noProjectsTitle") || "Layihə Yoxdur",
        noProjectsDesc: t("projectsPage.noProjectsDesc") || "Hələ heç bir layihə yaratmamısınız.",
        createFirst: t("projectsPage.createFirst") || "İlk Layihəni Yarat",
        statusLabels: {
          PLANNING: t("projectStatus.PLANNING") || "Planlanır",
          ACTIVE: t("projectStatus.ACTIVE") || "Aktiv",
          ON_HOLD: t("projectStatus.ON_HOLD") || "Dayandırılıb",
          COMPLETED: t("projectStatus.COMPLETED") || "Tamamlandı",
          CANCELLED: t("projectStatus.CANCELLED") || "Ləğv edildi",
        },
      }}
    />
  );
}
