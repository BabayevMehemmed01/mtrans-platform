import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { projectSchema } from "@/lib/validations";
import { hasPermission, isDepartmentHead, PermissionError } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

// =============================================================================
// GET /api/projects — Şirkətin bütün layihələrini qaytar
// POST /api/projects — Yeni layihə yarat (Standart və ya Collab)
// =============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
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
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const companyId = (session.user as any).companyId;
    const userId = session.user.id;
    const body = await req.json();

    // departmentId sahəsini optional/nullable edərək Collab layihələrinə də icazə veririk
    const collabProjectSchema = projectSchema.extend({
      departmentId: z.string().optional().nullable(),
    });

    const parsed = collabProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }

    const { name, description, status, priority, color, startDate, endDate, departmentId } =
      parsed.data;

    let department = null;
    if (departmentId) {
      // Əgər şöbə seçilibsə, onun birbaşa bu şirkətə aid olduğunu yoxlayırıq
      department = await prisma.department.findFirst({
        where: { id: departmentId, companyId },
      });
      if (!department) {
        return NextResponse.json(
          { error: "Şöbə tapılmadı" },
          { status: 400 }
        );
      }
    }

    // İcazə yoxlaması: Əgər şöbə varsa şöbə rəhbəri və ya CAN_CREATE_PROJECT, 
    // əgər Collab-dırsa (şöbə yoxdur) birbaşa CAN_CREATE_PROJECT icazəsi tələb olunur.
    const canCreate = department
      ? (await hasPermission(userId, "CAN_CREATE_PROJECT")) || (await isDepartmentHead(userId, department.id))
      : await hasPermission(userId, "CAN_CREATE_PROJECT");

    if (!canCreate) {
      throw new PermissionError("Layihə yaratmaq üçün icazəniz yoxdur");
    }

    const project = await prisma.$transaction(async (tx) => {
      // Layihəni yarat (Şöbəsiz olduqda departmentId null olacaq)
      const proj = await tx.project.create({
        data: {
          name,
          description,
          status: status as any,
          priority: priority as any,
          color: color ?? "#8b5cf6",
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          companyId,
          ownerId: userId,
          departmentId: department ? department.id : null,
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