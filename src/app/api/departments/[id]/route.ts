import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateDepartmentSchema } from "@/lib/validations";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const companyId = (session.user as any).companyId;

    const existing = await prisma.department.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Department not found" }, { status: 404 });

    await requirePermission(session.user.id, "CAN_EDIT_DEPARTMENT");

    const body = await req.json();
    const parsed = updateDepartmentSchema.safeParse(body);
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

    const updateResult = await prisma.department.updateMany({
      where: { id, companyId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.headUserId !== undefined && { headUserId: data.headUserId || null }),
      },
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        head: { select: { id: true, name: true, avatar: true } },
        _count: { select: { users: true, projects: true } },
      },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "UPDATE",
      entityType: "DEPARTMENT",
      entityId: id,
      entityName: department?.name,
    });

    return NextResponse.json(department);
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[PATCH /api/departments/[id]]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const companyId = (session.user as any).companyId;

    const department = await prisma.department.findFirst({
      where: { id, companyId },
    });

    if (!department) {
      return NextResponse.json({ error: "Department not found" }, { status: 404 });
    }

    await requirePermission(session.user.id, "CAN_DELETE_DEPARTMENT");

    await prisma.department.delete({
      where: { id },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "DELETE",
      entityType: "DEPARTMENT",
      entityId: department.id,
      entityName: department.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[DELETE /api/departments/[id]]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
