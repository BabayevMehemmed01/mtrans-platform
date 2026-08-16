import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const companyId = (session.user as any).companyId;

    // 1. İstifadəçinin aktiv layihələri (Son 3 ədəd)
    const myProjects = await prisma.projectMember.findMany({
      where: { userId },
      include: { 
        project: { select: { id: true, name: true, status: true, color: true } } 
      },
      take: 3,
      orderBy: { joinedAt: "desc" }
    });

    // 2. İstifadəçiyə təyin olunmuş, bitməmiş tapşırıqlar (Son 4 ədəd)
    const myTasks = await prisma.task.findMany({
      where: { assigneeId: userId, isArchived: false, status: { not: "DONE" } },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, status: true, priority: true },
      take: 4,
    });

    // 3. Eyni şirkətdəki komanda yoldaşları (Son 5 nəfər)
    const myTeam = await prisma.user.findMany({
      where: { companyId, id: { not: userId }, status: "ACTIVE" },
      select: { 
        id: true, 
        name: true, 
        avatar: true, 
        jobTitle: true,
        role: { select: { name: true } }
      },
      take: 5,
    });

    return NextResponse.json({
      projects: myProjects.map((pm) => pm.project),
      tasks: myTasks,
      team: myTeam,
    });
  } catch (error) {
    console.error("[PROFILE_SUMMARY_ERROR]", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}