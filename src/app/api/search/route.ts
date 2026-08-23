import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// =============================================================================
// GET /api/search?q=<term>&project=<projectId>
//
// Qlobal, kontekst-məlumatlı axtarış. Layihələr, tapşırıqlar, komanda üzvləri
// və şöbələr arasında şirkət daxilində axtarır. `project` verilibsə, həmin
// layihənin tapşırıqları nəticələrin başına çıxarılır (kontekst-aware).
// =============================================================================

const RESULT_LIMIT = 6;

function projectHref(id: string, isCollab: boolean, extra?: string) {
  const base = isCollab ? `/dashboard/collab/${id}` : `/dashboard/projects/${id}`;
  return extra ? `${base}${extra}` : base;
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ query: "", groups: [] });

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const contextProjectId = searchParams.get("project") ?? undefined;

    if (q.length < 1) {
      return NextResponse.json({ query: "", groups: [] });
    }

    const [projects, tasks, members, departments, contextTasks] = await Promise.all([
      prisma.project.findMany({
        where: { companyId, isArchived: false, name: { contains: q, mode: "insensitive" } },
        select: { id: true, name: true, status: true, departmentId: true, department: { select: { name: true } } },
        orderBy: { updatedAt: "desc" },
        take: RESULT_LIMIT,
      }),
      prisma.task.findMany({
        where: {
          project: { companyId },
          isArchived: false,
          title: { contains: q, mode: "insensitive" },
          ...(contextProjectId ? { projectId: { not: contextProjectId } } : {}),
        },
        select: {
          id: true,
          title: true,
          status: true,
          projectId: true,
          project: { select: { name: true, departmentId: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: RESULT_LIMIT,
      }),
      prisma.user.findMany({
        where: {
          companyId,
          status: "ACTIVE",
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, email: true, avatar: true, jobTitle: true },
        take: RESULT_LIMIT,
      }),
      prisma.department.findMany({
        where: { companyId, isActive: true, name: { contains: q, mode: "insensitive" } },
        select: { id: true, name: true, _count: { select: { users: true } } },
        take: RESULT_LIMIT,
      }),
      contextProjectId
        ? prisma.task.findMany({
            where: {
              projectId: contextProjectId,
              isArchived: false,
              title: { contains: q, mode: "insensitive" },
            },
            select: {
              id: true,
              title: true,
              status: true,
              projectId: true,
              project: { select: { name: true, departmentId: true } },
            },
            orderBy: { updatedAt: "desc" },
            take: RESULT_LIMIT,
          })
        : Promise.resolve([]),
    ]);

    const groups: Array<{ id: string; label: string; items: any[] }> = [];

    if (contextTasks.length > 0) {
      groups.push({
        id: "context-tasks",
        label: "Bu Layihədə",
        items: contextTasks.map((t) => ({
          id: t.id,
          title: t.title,
          subtitle: t.project.name,
          href: projectHref(t.projectId, !t.project.departmentId, `?tab=list&task=${t.id}`),
          type: "task",
          meta: t.status,
        })),
      });
    }

    if (projects.length > 0) {
      groups.push({
        id: "projects",
        label: "Layihələr",
        items: projects.map((p) => ({
          id: p.id,
          title: p.name,
          subtitle: p.department?.name ?? "Kollaborasiya",
          href: projectHref(p.id, !p.departmentId),
          type: "project",
          meta: p.status,
        })),
      });
    }

    if (tasks.length > 0) {
      groups.push({
        id: "tasks",
        label: "Tapşırıqlar",
        items: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          subtitle: t.project.name,
          href: projectHref(t.projectId, !t.project.departmentId, `?tab=list&task=${t.id}`),
          type: "task",
          meta: t.status,
        })),
      });
    }

    if (members.length > 0) {
      groups.push({
        id: "members",
        label: "Komanda",
        items: members.map((m) => ({
          id: m.id,
          title: m.name ?? m.email,
          subtitle: m.jobTitle ?? m.email,
          href: `/dashboard/members?q=${encodeURIComponent(m.name ?? m.email ?? "")}`,
          type: "member",
          avatar: m.avatar,
        })),
      });
    }

    if (departments.length > 0) {
      groups.push({
        id: "departments",
        label: "Şöbələr",
        items: departments.map((d) => ({
          id: d.id,
          title: d.name,
          subtitle: `${d._count.users} üzv`,
          href: `/dashboard/departments/${d.id}`,
          type: "department",
        })),
      });
    }

    return NextResponse.json({ query: q, groups });
  } catch (error) {
    console.error("[GET /api/search]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
