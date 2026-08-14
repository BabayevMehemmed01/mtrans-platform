import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { updateCommentSchema } from "@/lib/validations";

interface RouteParams {
  params: Promise<{ id: string; commentId: string }>;
}

// =============================================================================
// PATCH  /api/tasks/[id]/comments/[commentId]  — Öz şərhini redaktə et
// DELETE /api/tasks/[id]/comments/[commentId]  — Öz şərhi və ya CAN_DELETE_ANY_COMMENT ilə sil
// =============================================================================

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, commentId } = await params;
    const companyId = (session.user as any).companyId;
    const userId = session.user.id as string;

    const body = await req.json();
    const parsed = updateCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.findFirst({
      where: { id: commentId, taskId: id, task: { project: { companyId } } },
    });
    if (!comment) return NextResponse.json({ error: "Şərh tapılmadı" }, { status: 404 });

    if (comment.authorId !== userId) {
      return NextResponse.json(
        { error: "Yalnız öz şərhinizi redaktə edə bilərsiniz" },
        { status: 403 }
      );
    }

    // Redaktədə mention-ları yenidən hesabla (layihə üzvlərinə əsasən)
    const task = await prisma.task.findFirst({
      where: { id },
      select: {
        project: {
          select: { members: { select: { user: { select: { id: true, name: true } } } } },
        },
      },
    });
    const membersList = task?.project.members.map((pm) => pm.user) ?? [];
    const sortedByNameLength = [...membersList].sort((a, b) => b.name.length - a.name.length);
    const mentionedUserIds = Array.from(
      new Set(
        sortedByNameLength
          .filter((m) => m.name && parsed.data.content.includes(`@${m.name}`))
          .map((m) => m.id)
      )
    );

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: parsed.data.content, isEdited: true, mentionedUserIds },
      include: { author: { select: { id: true, name: true, avatar: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/tasks/[id]/comments/[commentId]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, commentId } = await params;
    const companyId = (session.user as any).companyId;
    const userId = session.user.id as string;

    const comment = await prisma.comment.findFirst({
      where: { id: commentId, taskId: id, task: { project: { companyId } } },
    });
    if (!comment) return NextResponse.json({ error: "Şərh tapılmadı" }, { status: 404 });

    if (comment.authorId !== userId) {
      const canDeleteAny = await hasPermission(userId, "CAN_DELETE_ANY_COMMENT");
      if (!canDeleteAny) {
        return NextResponse.json(
          { error: "Bu şərhi silmək üçün icazəniz yoxdur" },
          { status: 403 }
        );
      }
    }

    // Comment.parentId relation-u onDelete: Cascade olduğu üçün cavablar da silinəcək
    await prisma.comment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/tasks/[id]/comments/[commentId]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
