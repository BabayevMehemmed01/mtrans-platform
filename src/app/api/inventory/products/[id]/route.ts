import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProductSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

// =============================================================================
// GET /api/inventory/products/:id — Bir məhsulun detalları (qalıqlar daxil)
// PATCH /api/inventory/products/:id — Məhsulu redaktə et
// DELETE /api/inventory/products/:id — Məhsulu deaktiv et (soft-delete)
// =============================================================================

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;

    const { id } = await params;
    const product = await prisma.product.findFirst({
      where: { id, companyId },
      include: {
        inventoryLevels: {
          include: { warehouse: { select: { id: true, name: true } }, bin: { select: { id: true, code: true } } },
        },
      },
    });
    if (!product) return NextResponse.json({ error: "Məhsul tapılmadı" }, { status: 404 });

    return NextResponse.json({
      ...product,
      totalQuantity: product.inventoryLevels.reduce((s, l) => s + l.quantity, 0),
    });
  } catch (error) {
    console.error("[GET /api/inventory/products/:id]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;

    const { id } = await params;
    const existing = await prisma.product.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Məhsul tapılmadı" }, { status: 404 });

    const body = await req.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    if (data.sku && data.sku !== existing.sku) {
      const dup = await prisma.product.findFirst({ where: { companyId, sku: data.sku, id: { not: id } } });
      if (dup) return NextResponse.json({ error: "Bu SKU artıq mövcuddur" }, { status: 409 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(data.sku !== undefined && { sku: data.sku }),
        ...(data.barcode !== undefined && { barcode: data.barcode || null }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.category !== undefined && { category: data.category || null }),
        ...(data.unit !== undefined && { unit: data.unit }),
        ...(data.minStockLimit !== undefined && { minStockLimit: data.minStockLimit }),
        ...(data.purchasePrice !== undefined && { purchasePrice: data.purchasePrice }),
        ...(data.salesPrice !== undefined && { salesPrice: data.salesPrice }),
        ...(data.isTrackedByBatch !== undefined && { isTrackedByBatch: data.isTrackedByBatch }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "UPDATE",
      entityType: "PRODUCT",
      entityId: updated.id,
      entityName: updated.name,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/inventory/products/:id]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;

    const { id } = await params;
    const existing = await prisma.product.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Məhsul tapılmadı" }, { status: 404 });

    // Soft-delete — stok hərəkətləri tarixçəsi qorunur, məhsul kataloqdan gizlədilir.
    await prisma.product.update({ where: { id }, data: { isActive: false } });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "DELETE",
      entityType: "PRODUCT",
      entityId: existing.id,
      entityName: existing.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/inventory/products/:id]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
