import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewProject } from "@/lib/permissions";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const companyId = (session.user as any).companyId;

    const project = await prisma.project.findFirst({
      where: { id, companyId },
      select: { id: true },
    });
    if (!project) return NextResponse.json({ error: "Layihə tapılmadı" }, { status: 404 });
    if (!(await canViewProject(session.user.id, id))) {
      return NextResponse.json({ error: "Bu layihəyə giriş icazəniz yoxdur" }, { status: 403 });
    }

    const attachments = await prisma.attachment.findMany({
      where: { task: { projectId: id } },
      orderBy: { createdAt: "desc" },
      include: { uploadedBy: { select: { id: true, name: true, avatar: true } } },
    });

    return NextResponse.json(
      attachments.map((att) => ({
        ...att,
        source: "task",
      }))
    );
  } catch (error) {
    console.error("[GET /api/projects/[id]/files]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
