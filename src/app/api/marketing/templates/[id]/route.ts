import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateMarketingTemplateSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

// =============================================================================
// PATCH  /api/marketing/templates/:id — Şablonu redaktə et (isSystem olsa belə
//   sərbəst redaktə oluna bilər — yalnız SİLİNMƏSİ qadağandır).
// DELETE /api/marketing/templates/:id — Şablonu sil (isSystem=true olduqda qadağan).
// =============================================================================

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    const { id } = await params;
    const existing = await prisma.marketingTemplate.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Şablon tapılmadı" }, { status: 404 });

    const body = await req.json();
    const parsed = updateMarketingTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const updated = await prisma.marketingTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.subject !== undefined && { subject: data.subject || null }),
        ...(data.content !== undefined && { content: data.content || "" }),
      },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "UPDATE",
      entityType: "TEMPLATE",
      entityId: updated.id,
      entityName: updated.name,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/marketing/templates/:id]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    const { id } = await params;
    const existing = await prisma.marketingTemplate.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Şablon tapılmadı" }, { status: 404 });

    if (existing.isSystem) {
      return NextResponse.json(
        { error: "Standart (default) şablonlar silinə bilməz — lakin redaktə edilə bilər" },
        { status: 409 }
      );
    }

    await prisma.marketingTemplate.delete({ where: { id } });

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
    console.error("[DELETE /api/marketing/templates/:id]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
