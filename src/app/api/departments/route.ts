import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDepartmentSchema } from "@/lib/validations";
import { isSuperAdmin, PermissionError } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const companyId = (session.user as any).companyId;

    const departments = await prisma.department.findMany({
      where: { companyId },
      include: {
        head: { select: { id: true, name: true, avatar: true } },
        _count: {
          select: { users: true, projects: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error("[GET /api/departments]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const companyId = (session.user as any).companyId;

    // Yeni şöbə yaratmaq yalnız Super Admin-ə icazəlidir
    if (!(await isSuperAdmin(session.user.id))) {
      throw new PermissionError("Yeni şöbə yaratmaq yalnız Super Admin üçün mümkündür");
    }

    const body = await req.json();
    const parsed = createDepartmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // headUserId göndərilibsə, bu istifadəçinin eyni şirkətə aid olduğunu təsdiqlə
    if (data.headUserId) {
      const headUser = await prisma.user.findFirst({
        where: { id: data.headUserId, companyId },
      });
      if (!headUser) {
        return NextResponse.json({ error: "Seçilmiş rəhbər tapılmadı" }, { status: 400 });
      }
    }

    const department = await prisma.department.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color || "#6366f1",
        icon: data.icon,
        headUserId: data.headUserId || null,
        parentId: data.parentId || null,
        isDefault: data.isDefault ?? false,
        companyId,
      },
      include: {
        head: { select: { id: true, name: true, avatar: true } },
        _count: {
          select: { users: true, projects: true },
        },
      },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "CREATE",
      entityType: "DEPARTMENT",
      entityId: department.id,
      entityName: department.name,
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[POST /api/departments]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
