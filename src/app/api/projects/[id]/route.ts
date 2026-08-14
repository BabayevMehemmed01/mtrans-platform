import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProjectSchema } from "@/lib/validations";
import { requireProjectAccess, canViewProject, PermissionError } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// =============================================================================
// GET    /api/projects/[id]  — Layihə detalları (üzvlər üçün)
// PATCH  /api/projects/[id]  — Layihəni yenilə / arxivləşdir (Manager+)
// DELETE /api/projects/[id]  — Layihəni sil (Owner)
// =============================================================================

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const project = await prisma.project.findFirst({
      where: { id, companyId: (session.user as any).companyId },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        department: { select: { id: true, name: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, avatar: true, jobTitle: true } } } },
        _count: { select: { tasks: true } },
      },
    });
    if (!project) return NextResponse.json({ error: "Layihə tapılmadı" }, { status: 404 });

    if (!(await canViewProject(session.user.id, id))) {
      return NextResponse.json({ error: "Bu layihəyə giriş icazəniz yoxdur" }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("[GET /api/projects/[id]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const existing = await prisma.project.findFirst({
      where: { id, companyId: (session.user as any).companyId },
    });
    if (!existing) return NextResponse.json({ error: "Layihə tapılmadı" }, { status: 404 });

    await requireProjectAccess(session.user.id, id, "MANAGER", "CAN_EDIT_PROJECT");

    const body = await req.json();
    const parsed = updateProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.color !== undefined && data.color !== "") updateData.color = data.color;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if ("departmentId" in body) updateData.departmentId = body.departmentId || null;
    if ("isArchived" in body) updateData.isArchived = Boolean(body.isArchived);

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        department: { select: { id: true, name: true } },
      },
    });

    let auditAction: "ARCHIVE" | "RESTORE" | "COMPLETE" | "UPDATE" = "UPDATE";
    if (updateData.isArchived === true) auditAction = "ARCHIVE";
    else if (updateData.isArchived === false) auditAction = "RESTORE";
    else if (updateData.status === "COMPLETED" && existing.status !== "COMPLETED") auditAction = "COMPLETE";

    await logAudit({
      userId: session.user.id,
      companyId: (session.user as any).companyId,
      action: auditAction,
      entityType: "PROJECT",
      entityId: project.id,
      entityName: project.name,
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[PATCH /api/projects/[id]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const existing = await prisma.project.findFirst({
      where: { id, companyId: (session.user as any).companyId },
    });
    if (!existing) return NextResponse.json({ error: "Layihə tapılmadı" }, { status: 404 });

    await requireProjectAccess(session.user.id, id, "OWNER", "CAN_DELETE_PROJECT");

    await prisma.project.delete({ where: { id } });

    await logAudit({
      userId: session.user.id,
      companyId: (session.user as any).companyId,
      action: "DELETE",
      entityType: "PROJECT",
      entityId: existing.id,
      entityName: existing.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[DELETE /api/projects/[id]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
