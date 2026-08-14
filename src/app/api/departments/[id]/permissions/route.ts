import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { grantDepartmentPermissionSchema } from "@/lib/validations";
import { requireDepartmentManage, PermissionError } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

// =============================================================================
// PATCH /api/departments/[id]/permissions
// Şöbə rəhbəri (və ya Super Admin) şöbə üzvünə fərdi olaraq spesifik bir
// icazə verə (grant: true) və ya geri ala (grant: false) bilər. Bu, rolun
// verdiyi icazələrin üstünə əlavə olunur (additiv), rolu əvəz etmir.
// =============================================================================

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: departmentId } = await params;
    const companyId = (session.user as any).companyId;

    const department = await prisma.department.findFirst({ where: { id: departmentId, companyId } });
    if (!department) return NextResponse.json({ error: "Şöbə tapılmadı" }, { status: 404 });

    await requireDepartmentManage(session.user.id, departmentId, "CAN_ASSIGN_ROLE");

    const body = await req.json();
    const parsed = grantDepartmentPermissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const { userId, permissionKey, grant } = parsed.data;

    // Hədəf istifadəçi bu şöbəyə aid olmalıdır
    const targetUser = await prisma.user.findFirst({
      where: { id: userId, companyId, departmentId },
    });
    if (!targetUser) {
      return NextResponse.json({ error: "İstifadəçi bu şöbəyə aid deyil" }, { status: 400 });
    }

    const permission = await prisma.permission.findUnique({ where: { key: permissionKey } });
    if (!permission) return NextResponse.json({ error: "İcazə tapılmadı" }, { status: 400 });

    if (grant) {
      await prisma.userPermission.upsert({
        where: { userId_permissionId: { userId, permissionId: permission.id } },
        update: {},
        create: { userId, permissionId: permission.id, grantedById: session.user.id },
      });
    } else {
      await prisma.userPermission.deleteMany({
        where: { userId, permissionId: permission.id },
      });
    }

    await logAudit({
      userId: session.user.id,
      companyId,
      action: grant ? "ASSIGN" : "UPDATE",
      entityType: "USER",
      entityId: userId,
      entityName: `${permissionKey} ${grant ? "verildi" : "geri alındı"} (${targetUser.name})`,
    });

    const extraPermissions = await prisma.userPermission.findMany({
      where: { userId },
      select: { permission: { select: { key: true } } },
    });

    return NextResponse.json({
      userId,
      extraPermissionKeys: extraPermissions.map((p) => p.permission.key),
    });
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[PATCH /api/departments/[id]/permissions]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
