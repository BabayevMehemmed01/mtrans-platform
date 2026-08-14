import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string; attachmentId: string }>;
}

// =============================================================================
// DELETE /api/tasks/[id]/attachments/[attachmentId]
// Öz faylı və ya CAN_DELETE_ANY_FILE icazəsi ilə silinə bilər.
// =============================================================================

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, attachmentId } = await params;
    const companyId = (session.user as any).companyId;
    const userId = session.user.id as string;

    const attachment = await prisma.attachment.findFirst({
      where: { id: attachmentId, taskId: id, task: { project: { companyId } } },
    });
    if (!attachment) return NextResponse.json({ error: "Fayl tapılmadı" }, { status: 404 });

    if (attachment.uploadedById !== userId) {
      const canDeleteAny = await hasPermission(userId, "CAN_DELETE_ANY_FILE");
      if (!canDeleteAny) {
        return NextResponse.json(
          { error: "Bu faylı silmək üçün icazəniz yoxdur" },
          { status: 403 }
        );
      }
    }

    await prisma.attachment.delete({ where: { id: attachmentId } });

    await logAudit({
      userId,
      companyId,
      action: "DELETE",
      entityType: "ATTACHMENT",
      entityId: attachment.id,
      entityName: attachment.fileName,
    });

    // Best-effort: UploadThing storage-dan da faylı sil (uğursuz olsa belə DB silinməsi geri qaytarılmır)
    try {
      const { UTApi } = await import("uploadthing/server");
      const utapi = new UTApi();
      await utapi.deleteFiles(attachment.fileKey);
    } catch (e) {
      console.error("[UTApi delete failed]", e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/tasks/[id]/attachments/[attachmentId]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
