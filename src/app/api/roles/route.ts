import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRoleSchema } from "@/lib/validations";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const companyId = (session.user as any).companyId;

    const roles = await prisma.role.findMany({
      where: { companyId },
      include: {
        permissions: {
          include: {
            permission: { select: { id: true, key: true, name: true, category: true } },
          },
        },
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error("[GET /api/roles]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const companyId = (session.user as any).companyId;

    await requirePermission(session.user.id, "CAN_CREATE_ROLE");

    const body = await req.json();
    const parsed = createRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const { name, description, color, permissionIds } = parsed.data;

    const role = await prisma.$transaction(async (tx) => {
      const newRole = await tx.role.create({
        data: { name, description, color: color || "#8b5cf6", companyId },
      });

      if (permissionIds && permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((pid: string) => ({
            roleId: newRole.id,
            permissionId: pid,
          })),
        });
      }

      return tx.role.findUnique({
        where: { id: newRole.id },
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
      action: "CREATE",
      entityType: "ROLE",
      entityId: role!.id,
      entityName: role!.name,
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[POST /api/roles]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
