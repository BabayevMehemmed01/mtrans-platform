import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Users, LayoutGrid, CheckSquare } from "lucide-react";
import { getStatusColor, getPriorityColor } from "@/lib/utils";

export default async function CollabPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const companyId = (session.user as any).companyId;
  if (!companyId) redirect("/onboarding");

  // YALNIZ şöbəsi olmayan (Collab) layihələri çəkirik
  const collabProjects = await prisma.project.findMany({
    where: { 
      companyId, 
      departmentId: null, // Sırf Collab layihələr
      isArchived: false 
    },
    include: {
      owner: { select: { name: true, avatar: true } },
      _count: { select: { members: true, tasks: true } }
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Ortaq Layihələr (Collab)</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Fərqli şöbələrdən olan mütəxəssisləri eyni məkanda birləşdirin.
          </p>
        </div>
        <Link
          href="/dashboard/collab/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all hover:shadow-md"
        >
          <Plus className="w-5 h-5" /> Yeni Collab Layihə
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {collabProjects.map((project) => (
          <Link href={`/dashboard/projects/${project.id}?tab=tasks`} key={project.id} className="group">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-5 hover:border-blue-300 hover:shadow-md transition-all flex flex-col h-full cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                  style={{ backgroundColor: project.color }}
                >
                  {project.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${getPriorityColor(project.priority)}`}>
                    {project.priority}
                  </span>
                </div>
              </div>
              
              <h3 className="text-[16px] font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                {project.name}
              </h3>
              
              <div className="mt-auto pt-4 flex items-center justify-between text-[12px] font-bold text-slate-500 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>{project._count.members} Üzv</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-green-500" />
                  <span>{project._count.tasks} Task</span>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {collabProjects.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-dashed border-gray-300 p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <LayoutGrid className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Hələ heç bir Collab layihəsi yoxdur</h3>
            <p className="text-sm font-medium text-slate-500 mt-2 max-w-sm">
              Collab yaradaraq müxtəlif şöbələrdən olan komanda yoldaşlarınızı bir yerə toplayın.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}