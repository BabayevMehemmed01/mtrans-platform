import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateRoleSchema } from "@/lib/validations";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const companyId = (session.user as any).companyId;

    const existing = await prisma.role.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Role not found" }, { status: 404 });
    if (existing.isSystem) return NextResponse.json({ error: "System roles cannot be edited" }, { status: 403 });

    await requirePermission(session.user.id, "CAN_EDIT_ROLE");

    const body = await req.json();
    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const { name, description, color, permissionIds } = parsed.data;

    const role = await prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
          ...(color !== undefined && { color }),
        },
      });

      // Əgər permissionIds göndərilibsə icazələri tamamilə əvəz edirik
      if (permissionIds !== undefined) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        if (permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: permissionIds.map((pid: string) => ({ roleId: id, permissionId: pid })),
          });
        }
      }

      return tx.role.findUnique({
        where: { id },
        include: {
          permissions: {
            include: { permission: { select: { id: true, key: true, name: true, category: true } } },
          },
          _count: { select: { users: true } },
        },
      });
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "UPDATE",
      entityType: "ROLE",
      entityId: id,
      entityName: role?.name,
    });

    return NextResponse.json(role);
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[PATCH /api/roles/[id]]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const companyId = (session.user as any).companyId;

    const role = await prisma.role.findFirst({ where: { id, companyId } });
    if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 });
    if (role.isSystem) return NextResponse.json({ error: "System roles cannot be deleted" }, { status: 403 });

    await requirePermission(session.user.id, "CAN_DELETE_ROLE");

    await prisma.role.delete({ where: { id } });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "DELETE",
      entityType: "ROLE",
      entityId: role.id,
      entityName: role.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[DELETE /api/roles/[id]]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
