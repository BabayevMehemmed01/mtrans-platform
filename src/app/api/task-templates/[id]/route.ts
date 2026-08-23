import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTaskTemplateSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

// =============================================================================
// PATCH  /api/task-templates/[id] — Tapşırıq şablonunu redaktə et
// DELETE /api/task-templates/[id] — Tapşırıq şablonunu sil
// =============================================================================

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const { id } = await params;
    const companyId = (session.user as any).companyId as string | undefined;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    const existing = await prisma.taskTemplate.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Şablon tapılmadı" }, { status: 404 });

    const body = await req.json();
    const parsed = updateTaskTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const { name, description, departmentId, data } = parsed.data;

    let nextDepartmentId = existing.departmentId;
    if (departmentId !== undefined) {
      nextDepartmentId = departmentId || null;
      if (nextDepartmentId) {
        const dept = await prisma.department.findFirst({ where: { id: nextDepartmentId, companyId } });
        if (!dept) nextDepartmentId = null;
      }
    }

    const template = await prisma.taskTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description || null }),
        ...(data !== undefined && { data }),
        departmentId: nextDepartmentId,
      },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "UPDATE",
      entityType: "TEMPLATE",
      entityId: template.id,
      entityName: template.name,
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("[PATCH /api/task-templates/[id]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const { id } = await params;
    const companyId = (session.user as any).companyId as string | undefined;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    const existing = await prisma.taskTemplate.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Şablon tapılmadı" }, { status: 404 });

    await prisma.taskTemplate.delete({ where: { id } });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "DELETE",
      entityType: "TEMPLATE",
      entityId: existing.id,
      entityName: existing.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/task-templates/[id]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
