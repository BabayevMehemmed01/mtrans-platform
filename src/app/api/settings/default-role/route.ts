import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { requirePermission, PermissionError } from "@/lib/permissions";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const companyId = (session.user as any).companyId;
    if (!companyId) return new NextResponse("No company", { status: 400 });

    await requirePermission(session.user.id, "CAN_MANAGE_COMPANY");

    const { roleId } = await req.json();

    if (!roleId) {
      return new NextResponse("Role ID required", { status: 400 });
    }

    // Verify role belongs to company
    const role = await prisma.role.findFirst({
      where: { id: roleId, companyId },
    });

    if (!role) {
      return new NextResponse("Role not found", { status: 404 });
    }

    // Use transaction to unset existing defaults and set the new one
    await prisma.$transaction([
      prisma.role.updateMany({
        where: { companyId },
        data: { isDefault: false },
      }),
      prisma.role.update({
        where: { id: roleId },
        data: { isDefault: true },
      }),
    ]);

    return NextResponse.json({ success: true, roleId });
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[DEFAULT_ROLE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
