import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/my-tasks — giriş edən istifadəçinin BÜTÜN layihələrdəki tapşırıqları
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as any).id;
    const companyId = (session.user as any).companyId;

    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        project: { companyId },
        parentId: null,
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true, color: true } },
        labels: { include: { label: true } },
        _count: { select: { subtasks: true, comments: true, attachments: true } },
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("[GET /api/my-tasks]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
