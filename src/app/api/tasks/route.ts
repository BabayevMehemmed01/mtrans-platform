import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTaskSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

// =============================================================================
// GET  /api/tasks?projectId=xxx  — Layihənin tapşırıqlarını qaytar
// POST /api/tasks                — Yeni tapşırıq yarat
// =============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const assigneeId = searchParams.get("assigneeId");
    const showArchived = searchParams.get("archived") === "true";

    const tasks = await prisma.task.findMany({
      where: {
        ...(projectId ? { projectId } : { project: { companyId: (session.user as any).companyId } }),
        ...(status ? { status: status as any } : {}),
        ...(assigneeId ? { assigneeId } : {}),
        isArchived: showArchived,
        parentId: null,
      },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        labels: { include: { label: true } },
        _count: { select: { subtasks: true, comments: true, attachments: true } },
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("[GET /api/tasks]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }

    const {
      title, description, status, priority, dueDate,
      startDate, estimatedHours, assigneeId, parentId,
      labelIds, projectId,
    } = parsed.data;

    // Proyektin şirkətə aid olduğunu yoxla
    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId: (session.user as any).companyId },
    });
    if (!project) return NextResponse.json({ error: "Layihə tapılmadı" }, { status: 404 });

    // Max order-i tap
    const maxPos = await prisma.task.aggregate({
      where: { projectId, status: (status as any) ?? "TODO" },
      _max: { position: true },
    });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: (status as any) ?? "TODO",
        priority: (priority as any) ?? "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        estimatedHours,
        position: (maxPos._max.position ?? 0) + 1,
        projectId,
        assigneeId: assigneeId || null,
        parentId: parentId || null,
        createdById: session.user.id,
        labels: labelIds?.length
          ? { create: labelIds.map((id: string) => ({ labelId: id })) }
          : undefined,
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        labels: { include: { label: true } },
        _count: { select: { subtasks: true, comments: true, attachments: true } },
      },
    });

    await logAudit({
      userId: session.user.id,
      companyId: (session.user as any).companyId,
      action: "CREATE",
      entityType: "TASK",
      entityId: task.id,
      entityName: task.title,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tasks]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
