import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTaskSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// =============================================================================
// GET    /api/tasks/[id]  — Tapşırıq detalları
// PATCH  /api/tasks/[id]  — Tapşırığı yenilə (inline edit + drag status)
// DELETE /api/tasks/[id]  — Tapşırığı sil
// =============================================================================

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const task = await prisma.task.findFirst({
      where: { id, project: { companyId: (session.user as any).companyId } },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        createdBy: { select: { id: true, name: true, avatar: true } },
        labels: { include: { label: true } },
        subtasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assigneeId: true,
            assignee: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { position: "asc" },
        },
        comments: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { id: true, name: true, avatar: true } } },
        },
        attachments: true,
        _count: { select: { subtasks: true, comments: true, attachments: true } },
      },
    });

    if (!task) return NextResponse.json({ error: "Tapşırıq tapılmadı" }, { status: 404 });
    return NextResponse.json(task);
  } catch (error) {
    console.error("[GET /api/tasks/[id]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();

    // Tapşırığın bu şirkətə aid olduğunu yoxla
    const existing = await prisma.task.findFirst({
      where: { id, project: { companyId: (session.user as any).companyId } },
    });
    if (!existing) return NextResponse.json({ error: "Tapşırıq tapılmadı" }, { status: 404 });

    // labelIds ayrıca işlənir
    const { labelIds, ...rest } = body;

    const parsed = updateTaskSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const data = parsed.data;

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if ("assigneeId" in body) updateData.assigneeId = body.assigneeId || null;
    if ("dueDate" in body) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if ("startDate" in body) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if ("estimatedHours" in body) updateData.estimatedHours = body.estimatedHours;
    if ("isArchived" in body) updateData.isArchived = !!body.isArchived;
    if (data.status === "DONE" && existing.status !== "DONE") updateData.completedAt = new Date();
    if (data.status !== undefined && data.status !== "DONE") updateData.completedAt = null;

    const task = await prisma.$transaction(async (tx) => {
      // Labels-i yenilə (varsa)
      if (labelIds !== undefined) {
        await tx.taskLabel.deleteMany({ where: { taskId: id } });
        if (labelIds.length > 0) {
          await tx.taskLabel.createMany({
            data: labelIds.map((lid: string) => ({ taskId: id, labelId: lid })),
          });
        }
      }

      return tx.task.update({
        where: { id },
        data: updateData,
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          labels: { include: { label: true } },
          _count: { select: { subtasks: true, comments: true, attachments: true } },
        },
      });
    });

    let auditAction: "COMPLETE" | "ASSIGN" | "UPDATE" = "UPDATE";
    if (data.status === "DONE" && existing.status !== "DONE") {
      auditAction = "COMPLETE";
    } else if ("assigneeId" in body && body.assigneeId !== existing.assigneeId) {
      auditAction = "ASSIGN";
    }

    await logAudit({
      userId: session.user.id,
      companyId: (session.user as any).companyId,
      action: auditAction,
      entityType: "TASK",
      entityId: task.id,
      entityName: task.title,
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("[PATCH /api/tasks/[id]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const existing = await prisma.task.findFirst({
      where: { id, project: { companyId: (session.user as any).companyId } },
    });
    if (!existing) return NextResponse.json({ error: "Tapşırıq tapılmadı" }, { status: 404 });

    await prisma.task.delete({ where: { id } });

    await logAudit({
      userId: session.user.id,
      companyId: (session.user as any).companyId,
      action: "DELETE",
      entityType: "TASK",
      entityId: existing.id,
      entityName: existing.title,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/tasks/[id]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
