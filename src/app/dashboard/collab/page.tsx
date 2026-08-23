import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Users, LayoutGrid, CheckSquare } from "lucide-react";
import { getStatusColor, getPriorityColor, getInitials } from "@/lib/utils";
import { getTranslation } from "@/lib/i18n"; // YENİ
import { Progress } from "@/components/ui/progress";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";

export default async function CollabPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;
  if (!companyId) redirect("/onboarding");

  // YENİ: Tərcümə
  const lang = (session.user as any)?.language || "az";
  const t = getTranslation(lang);

  // YALNIZ şöbəsi olmayan (Collab) layihələri çəkirik
  const collabProjects = await prisma.project.findMany({
    where: { 
      companyId, 
      departmentId: null, // Sırf Collab layihələr
      isArchived: false 
    },
    include: {
      owner: { select: { name: true, avatar: true } },
      members: {
        take: 5,
        select: { user: { select: { id: true, name: true, avatar: true } } },
      },
      tasks: { select: { status: true, isArchived: true } },
      _count: { select: { members: true, tasks: true } }
    },
    orderBy: { createdAt: "desc" },
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {collabProjects.map((project) => {
          const activeTasks = project.tasks.filter((task) => !task.isArchived);
          const doneCount = activeTasks.filter((task) => task.status === "DONE").length;
          const progressPct = activeTasks.length > 0 ? Math.round((doneCount / activeTasks.length) * 100) : 0;
          const extraMembers = Math.max(0, project._count.members - project.members.length);

          return (
          <Link href={`/dashboard/collab/${project.id}?tab=list`} key={project.id} className="group">
            <div className="card-hover bg-card rounded-2xl border border-border p-5 hover:border-primary/40 transition-all flex flex-col h-full cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                  style={{ backgroundColor: project.color }}
                >
                  {project.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${getStatusColor(project.status)}`}>
                    {t(`projectStatus.${project.status}`) || project.status}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${getPriorityColor(project.priority)}`}>
                    {t(`priority.${project.priority}`) || project.priority}
                  </span>
                </div>
              </div>
              
              <h3 className="text-[16px] font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                {project.name}
              </h3>

              <div className="space-y-1.5 mb-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                  <span>İcra</span>
                  <span className="text-foreground">{progressPct}%</span>
                </div>
                <Progress value={progressPct} className="h-1.5" />
              </div>
              
              <div className="mt-auto pt-4 flex items-center justify-between text-[12px] font-bold text-muted-foreground border-t border-border">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                    {doneCount}/{activeTasks.length}
                  </span>
                </div>
                {project.members.length > 0 ? (
                  <AvatarGroup>
                    {project.members.map(({ user }) => (
                      <Avatar key={user.id} size="sm">
                        <AvatarImage src={user.avatar ?? undefined} alt={user.name} />
                        <AvatarFallback className="text-[9px]">{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                    ))}
                    {extraMembers > 0 && (
                      <AvatarGroupCount className="size-6 text-[9px]">+{extraMembers}</AvatarGroupCount>
                    )}
                  </AvatarGroup>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary" />
                    <span>{(t("collabPage.members") || "{count} Üzv").replace("{count}", String(project._count.members))}</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
          );
        })}

        {collabProjects.length === 0 && (
          <div className="col-span-full bg-card rounded-2xl border border-dashed border-border p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <LayoutGrid className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-foreground">{t("collabPage.emptyTitle") || "Hələ heç bir Collab layihəsi yoxdur"}</h3>
            <p className="text-sm font-medium text-muted-foreground mt-2 max-w-sm">
              {t("collabPage.emptyDesc") || "Collab yaradaraq müxtəlif şöbələrdən olan komanda yoldaşlarınızı bir yerə toplayın."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}