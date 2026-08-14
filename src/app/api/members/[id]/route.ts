import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const companyId = (session.user as any).companyId;
    
    // Yalnız şirkətin owneri və ya admin dəyişə bilər (Hələlik sadə check)
    
    const body = await req.json();
    const { name, departmentId, roleId, jobTitle, status } = body;

    const userToUpdate = await prisma.user.findFirst({
      where: { id, companyId },
    });

    if (!userToUpdate) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
        ...(roleId !== undefined && { roleId: roleId || null }),
        ...(jobTitle !== undefined && { jobTitle }),
        ...(status && { status }),
      },
      include: {
        department: { select: { id: true, name: true, color: true } },
        role: { select: { id: true, name: true, color: true } },
      },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "UPDATE",
      entityType: "USER",
      entityId: updatedUser.id,
      entityName: updatedUser.name,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[PATCH /api/members/[id]]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const companyId = (session.user as any).companyId;

    if (id === session.user.id) {
        return NextResponse.json({ error: "You cannot delete yourself" }, { status: 400 });
    }

    const member = await prisma.user.findFirst({
      where: { id, companyId },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Şirkətdən kənarlaşdırmaq üçün companyId-ni null etmək və ya birbaşa silmək olar.
    // Biz tam silirik ki, sistemdən silinsin (əgər çoxlu şirkətə aidiyyəti yoxdursa).
    await prisma.user.delete({
      where: { id },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "DELETE",
      entityType: "USER",
      entityId: member.id,
      entityName: member.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/members/[id]]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
