import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// =============================================================================
// GET  /api/tasks/[id]/attachments  — Tapşırığın fayllarını qaytar
// POST /api/tasks/[id]/attachments  — UploadThing yükləməsi bitdikdən sonra Attachment yaz
// =============================================================================

const createAttachmentSchema = z.object({
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  fileKey: z.string().min(1),
  fileType: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
  thumbnailUrl: z.string().optional().or(z.null()),
});

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const companyId = (session.user as any).companyId;

    const task = await prisma.task.findFirst({
      where: { id, project: { companyId } },
      select: { id: true },
    });
    if (!task) return NextResponse.json({ error: "Tapşırıq tapılmadı" }, { status: 404 });

    const attachments = await prisma.attachment.findMany({
      where: { taskId: id },
      orderBy: { createdAt: "desc" },
      include: { uploadedBy: { select: { id: true, name: true, avatar: true } } },
    });

    return NextResponse.json(attachments);
  } catch (error) {
    console.error("[GET /api/tasks/[id]/attachments]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const companyId = (session.user as any).companyId;

    const task = await prisma.task.findFirst({
      where: { id, project: { companyId } },
      select: { id: true },
    });
    if (!task) return NextResponse.json({ error: "Tapşırıq tapılmadı" }, { status: 404 });

    const body = await req.json();
    const parsed = createAttachmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }

    const attachment = await prisma.attachment.create({
      data: {
        fileName: parsed.data.fileName,
        fileUrl: parsed.data.fileUrl,
        fileKey: parsed.data.fileKey,
        fileType: parsed.data.fileType,
        fileSize: parsed.data.fileSize,
        thumbnailUrl: parsed.data.thumbnailUrl || null,
        taskId: id,
        uploadedById: session.user.id as string,
      },
      include: { uploadedBy: { select: { id: true, name: true, avatar: true } } },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "CREATE",
      entityType: "ATTACHMENT",
      entityId: attachment.id,
      entityName: attachment.fileName,
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error("[POST /api/tasks/[id]/attachments]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
