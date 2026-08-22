import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { processStockMovement } from "@/lib/inventoryService";

// =============================================================================
// PATCH /api/inventory/movements/:id — Draft sənədi icra et (status=COMPLETED,
//   InventoryLevel-ə tətbiq olunur) və ya ləğv et (status=CANCELLED).
// DELETE /api/inventory/movements/:id — Yalnız DRAFT statuslu sənədi silmək olar.
// =============================================================================

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const action = body?.action; // "process" | "cancel"

    const existing = await prisma.stockMovement.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Sənəd tapılmadı" }, { status: 404 });

    if (action === "cancel") {
      if (existing.status === "COMPLETED") {
        return NextResponse.json({ error: "İcra olunmuş sənəd ləğv edilə bilməz" }, { status: 409 });
      }
      const updated = await prisma.stockMovement.update({ where: { id }, data: { status: "CANCELLED" } });
      await logAudit({
        userId: session.user.id,
        companyId,
        action: "UPDATE",
        entityType: "STOCK_MOVEMENT",
        entityId: updated.id,
        entityName: updated.reference,
      });
      return NextResponse.json(updated);
    }

    // Default: icra et (process)
    const processed = await processStockMovement(id, companyId);

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "UPDATE",
      entityType: "STOCK_MOVEMENT",
      entityId: processed.id,
      entityName: processed.reference,
      metadata: { processed: true },
    });

    return NextResponse.json(processed);
  } catch (error) {
    console.error("[PATCH /api/inventory/movements/:id]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server xətası" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;

    const { id } = await params;
    const existing = await prisma.stockMovement.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Sənəd tapılmadı" }, { status: 404 });
    if (existing.status === "COMPLETED") {
      return NextResponse.json({ error: "İcra olunmuş sənəd silinə bilməz, əvəzinə ləğv edin" }, { status: 409 });
    }

    await prisma.stockMovement.delete({ where: { id } });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "DELETE",
      entityType: "STOCK_MOVEMENT",
      entityId: existing.id,
      entityName: existing.reference,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/inventory/movements/:id]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
