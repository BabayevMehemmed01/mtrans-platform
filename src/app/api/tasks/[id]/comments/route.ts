import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCommentSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// =============================================================================
// GET  /api/tasks/[id]/comments  — Tapşırığın şərhlərini qaytar (thread + mentions)
// POST /api/tasks/[id]/comments  — Yeni şərh (və ya cavab) yarat
// =============================================================================

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const { id } = await params;
    const companyId = (session.user as any).companyId;

    const task = await prisma.task.findFirst({
      where: { id, project: { companyId } },
      select: { id: true },
    });
    if (!task) return NextResponse.json({ error: "Tapşırıq tapılmadı" }, { status: 404 });

    const comments = await prisma.comment.findMany({
      where: { taskId: id },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("[GET /api/tasks/[id]/comments]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const { id } = await params;
    const companyId = (session.user as any).companyId;
    const userId = session.user.id as string;

    const body = await req.json();
    const parsed = createCommentSchema.safeParse({ ...body, taskId: id });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const { content, parentId } = parsed.data;

    // Tapşırığın bu şirkətə aid olduğunu və layihə üzvlərini yoxla (mention resolve üçün)
    const task = await prisma.task.findFirst({
      where: { id, project: { companyId } },
      select: {
        id: true,
        title: true,
        projectId: true,
        assigneeId: true,
        project: {
          select: {
            members: { select: { user: { select: { id: true, name: true } } } },
          },
        },
      },
    });
    if (!task) return NextResponse.json({ error: "Tapşırıq tapılmadı" }, { status: 404 });

    // Cavab yazılırsa, valideynin bu tapşırığa aid olduğunu yoxla
    let parentComment: { id: string; authorId: string } | null = null;
    if (parentId) {
      parentComment = await prisma.comment.findFirst({
        where: { id: parentId, taskId: id },
        select: { id: true, authorId: true },
      });
      if (!parentComment) {
        return NextResponse.json({ error: "Cavab yazılan şərh tapılmadı" }, { status: 404 });
      }
    }

    // ── @Name mention-ları layihə üzvləri arasından tap ──
    // Sadə yanaşma: hər üzvün tam adı "@Ad Soyad" şəklində mətndə axtarılır.
    // Ən uzun adlar əvvəlcə yoxlanır ki, qısa adların yarımçıq üst-üstə düşməsinin qarşısı alınsın.
    const membersList = task.project.members.map((pm) => pm.user);
    const sortedByNameLength = [...membersList].sort((a, b) => b.name.length - a.name.length);
    const mentionedUserIds = Array.from(
      new Set(
        sortedByNameLength
          .filter((m) => m.name && content.includes(`@${m.name}`))
          .map((m) => m.id)
      )
    );

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId: id,
        authorId: userId,
        parentId: parentId || null,
        mentionedUserIds,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    // ── Notification-lar ──
    const link = `/dashboard/projects/${task.projectId}?taskId=${task.id}`;
    const authorName = session.user.name ?? "Bir istifadəçi";
    const notificationsData: {
      type: "MENTION" | "COMMENT_ADDED" | "COMMENT_REPLY";
      message: string;
      link: string;
      userId: string;
      companyId: string;
    }[] = [];

    for (const mentionedId of mentionedUserIds) {
      if (mentionedId === userId) continue;
      notificationsData.push({
        type: "MENTION",
        message: `${authorName} sizi "${task.title}" tapşırığındakı bir şərhdə qeyd etdi`,
        link,
        userId: mentionedId,
        companyId,
      });
    }

    if (task.assigneeId && task.assigneeId !== userId) {
      notificationsData.push({
        type: "COMMENT_ADDED",
        message: `${authorName} "${task.title}" tapşırığına şərh yazdı`,
        link,
        userId: task.assigneeId,
        companyId,
      });
    }

    if (parentComment && parentComment.authorId !== userId) {
      notificationsData.push({
        type: "COMMENT_REPLY",
        message: `${authorName} şərhinizə cavab yazdı`,
        link,
        userId: parentComment.authorId,
        companyId,
      });
    }

    if (notificationsData.length > 0) {
      await prisma.notification.createMany({ data: notificationsData });
    }

    await logAudit({
      userId,
      companyId,
      action: "CREATE",
      entityType: "COMMENT",
      entityId: comment.id,
      entityName: content.length > 60 ? `${content.slice(0, 60)}...` : content,
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tasks/[id]/comments]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
