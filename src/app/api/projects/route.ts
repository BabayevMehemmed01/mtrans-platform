import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { projectSchema } from "@/lib/validations";
import { hasPermission, isDepartmentHead, PermissionError } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

// =============================================================================
// GET /api/projects — Şirkətin bütün layihələrini qaytar
// POST /api/projects — Yeni layihə yarat
// =============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const companyId = (session.user as any).companyId;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const archived = searchParams.get("archived") === "true";

    const projects = await prisma.project.findMany({
      where: {
        companyId,
        isArchived: archived,
        ...(status ? { status: status as any } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        department: { select: { id: true, name: true, color: true } },
        _count: { select: { tasks: true, members: true } },
        members: {
          take: 5,
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("[GET /api/projects]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const companyId = (session.user as any).companyId;
    const userId = session.user.id;
    const body = await req.json();

    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }

    const { name, description, status, priority, color, startDate, endDate, departmentId } =
      parsed.data;

    // Göndərilən şöbənin doğrudan da bu şirkətə aid olduğunu təsdiqlə (tenant isolation)
    const department = await prisma.department.findFirst({
      where: { id: departmentId, companyId },
    });
    if (!department) {
      return NextResponse.json(
        { error: "Şöbə tapılmadı" },
        { status: 400 }
      );
    }

    // Layihə yaratmaq üçün ya qlobal CAN_CREATE_PROJECT icazəsi, ya da bu
    // şöbənin rəhbəri olmaq lazımdır.
    const canCreate =
      (await hasPermission(userId, "CAN_CREATE_PROJECT")) ||
      (await isDepartmentHead(userId, department.id));
    if (!canCreate) {
      throw new PermissionError("Layihə yaratmaq üçün icazəniz yoxdur");
    }

    const project = await prisma.$transaction(async (tx) => {
      // Layihəni yarat
      const proj = await tx.project.create({
        data: {
          name,
          description,
          status: status as any,
          priority: priority as any,
          color: color ?? "#6366f1",
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          companyId,
          ownerId: userId,
          departmentId: department.id,
        },
      });

      // Sahibi avtomatik OWNER rolunda üzv kimi əlavə et
      await tx.projectMember.create({
        data: {
          projectId: proj.id,
          userId,
          role: "OWNER",
        },
      });

      return proj;
    });

    await logAudit({
      userId,
      companyId,
      action: "CREATE",
      entityType: "PROJECT",
      entityId: project.id,
      entityName: project.name,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[POST /api/projects]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
