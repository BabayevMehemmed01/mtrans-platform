import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateDepartmentSchema } from "@/lib/validations";
import { hasPermission, isSuperAdmin, isDepartmentHead, requirePermission, PermissionError } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

// Şöbə rəhbərinin (Super Admin olmadan) redaktə edə biləcəyi yeganə sahə —
// köklü dəyişikliklər (ad, rəng, silinmə və s.) yalnız CAN_EDIT_DEPARTMENT
// icazəsi olanlara aiddir.
const HEAD_EDITABLE_FIELDS = ["description"] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const userId = session.user.id;
    const companyId = (session.user as any).companyId;

    const existing = await prisma.department.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Department not found" }, { status: 404 });

    const body = await req.json();
    const parsed = updateDepartmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const canFullyEdit = await hasPermission(userId, "CAN_EDIT_DEPARTMENT");
    if (!canFullyEdit) {
      // Tam redaktə icazəsi yoxdursa, yalnız bu şöbənin rəhbəri VƏ yalnız
      // "təsvir" sahəsini dəyişməyə çalışırsa icazə veririk.
      const isHead = await isDepartmentHead(userId, id);
      const requestedFields = Object.keys(data);
      const onlyHeadEditableFields = requestedFields.every((f) =>
        (HEAD_EDITABLE_FIELDS as readonly string[]).includes(f)
      );
      if (!isHead || !onlyHeadEditableFields) {
        throw new PermissionError("Bu əməliyyat üçün icazəniz yoxdur: CAN_EDIT_DEPARTMENT");
      }
    }

    // headUserId göndərilibsə, bu istifadəçinin eyni şirkətə aid olduğunu təsdiqlə
    if (data.headUserId) {
      const headUser = await prisma.user.findFirst({
        where: { id: data.headUserId, companyId },
      });
      if (!headUser) {
        return NextResponse.json({ error: "Seçilmiş rəhbər tapılmadı" }, { status: 400 });
      }
    }

    // isDefault bayrağını yalnız Super Admin dəyişə bilər
    const canSetDefault = data.isDefault !== undefined ? await isSuperAdmin(userId) : true;
    if (!canSetDefault) {
      throw new PermissionError("Default şöbə statusunu yalnız Super Admin dəyişə bilər");
    }

    const updateResult = await prisma.department.updateMany({
      where: { id, companyId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.headUserId !== undefined && { headUserId: data.headUserId || null }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
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

    if (department.isDefault) {
      throw new PermissionError("Sancılmış (default) şöbələr silinə bilməz");
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
