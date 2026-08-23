import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTemplateSchema } from "@/lib/validations";
import { hasPermission, isSuperAdmin, PermissionError } from "@/lib/permissions";
import { getTemplateManagePermissions } from "@/lib/templates";
import { logAudit } from "@/lib/audit";

// =============================================================================
// PATCH /api/templates/[id] — Şablonu redaktə et (isSystem olsa belə icazəlidir)
// DELETE /api/templates/[id] — Şablonu sil (isSystem şablonlar SİLİNƏ BİLMƏZ)
// =============================================================================

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const { id } = await params;
    const companyId = (session.user as any).companyId;

    const existing = await prisma.template.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Şablon tapılmadı" }, { status: 404 });

    const perms = getTemplateManagePermissions(existing.type);
    const allowed =
      (await isSuperAdmin(session.user.id)) || (await hasPermission(session.user.id, perms.edit));
    if (!allowed) {
      throw new PermissionError("Bu şablonu redaktə etmək üçün icazəniz yoxdur");
    }

    const body = await req.json();
    const parsed = updateTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const { name, description, data } = parsed.data;

    const template = await prisma.template.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description || null }),
        ...(data !== undefined && { data }),
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
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Bu adda şablon artıq mövcuddur" }, { status: 409 });
    }
    console.error("[PATCH /api/templates/[id]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const { id } = await params;
    const companyId = (session.user as any).companyId;

    const existing = await prisma.template.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Şablon tapılmadı" }, { status: 404 });
    if (existing.isSystem) {
      return NextResponse.json(
        { error: "Standart (default) şablonlar silinə bilməz, lakin sərbəst redaktə edilə bilər" },
        { status: 403 }
      );
    }

    const perms = getTemplateManagePermissions(existing.type);
    const allowed =
      (await isSuperAdmin(session.user.id)) || (await hasPermission(session.user.id, perms.delete));
    if (!allowed) {
      throw new PermissionError("Bu şablonu silmək üçün icazəniz yoxdur");
    }

    await prisma.template.delete({ where: { id } });

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
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[DELETE /api/templates/[id]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
