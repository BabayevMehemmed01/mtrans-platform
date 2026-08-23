import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateSupplierSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

// =============================================================================
// PATCH  /api/inventory/suppliers/:id — Təchizatçı məlumatlarını redaktə et
// DELETE /api/inventory/suppliers/:id — Deaktiv et (soft-delete): əvvəlki sənəd
//   tarixçəsi (StockMovement.supplierId, PurchaseOrder) qorunur, seçim siyahılarından gizlədilir.
// =============================================================================

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    const { id } = await params;
    const existing = await prisma.supplier.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Təchizatçı tapılmadı" }, { status: 404 });

    const body = await req.json();
    const parsed = updateSupplierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    if (data.name && data.name.trim() !== existing.name) {
      const dup = await prisma.supplier.findFirst({ where: { companyId, name: data.name.trim(), id: { not: id } } });
      if (dup) return NextResponse.json({ error: "Bu adda təchizatçı artıq mövcuddur" }, { status: 409 });
    }

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.contactName !== undefined && { contactName: data.contactName || null }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.taxId !== undefined && { taxId: data.taxId || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        _count: { select: { purchaseOrders: true, stockMovements: true } },
      },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "UPDATE",
      entityType: "SUPPLIER",
      entityId: updated.id,
      entityName: updated.name,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/inventory/suppliers/:id]", error);
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
    const existing = await prisma.supplier.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Təchizatçı tapılmadı" }, { status: 404 });

    // Soft-delete — bağlı stok hərəkəti/sifariş tarixçəsi qorunur, seçim siyahılarından gizlədilir.
    await prisma.supplier.update({ where: { id }, data: { isActive: false } });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "DELETE",
      entityType: "SUPPLIER",
      entityId: existing.id,
      entityName: existing.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/inventory/suppliers/:id]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
