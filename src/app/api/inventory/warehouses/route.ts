import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createWarehouseSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

// =============================================================================
// GET /api/inventory/warehouses — Anbar → Zona → Hüceyrə (Bin) iyerarxiyası,
//   həmçinin hər anbarın cəmi qalıq miqdarı (real-time).
// POST /api/inventory/warehouses — Yeni anbar yarat (MAIN | TRANSIT).
// =============================================================================

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    const warehouses = await prisma.warehouse.findMany({
      where: { companyId },
      include: {
        zones: {
          include: { bins: { select: { id: true, code: true } } },
          orderBy: { name: "asc" },
        },
        inventoryLevels: { select: { quantity: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const result = warehouses.map((w) => {
      const { inventoryLevels, ...rest } = w;
      return {
        ...rest,
        totalQuantity: inventoryLevels.reduce((sum, l) => sum + l.quantity, 0),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/inventory/warehouses]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    const body = await req.json();
    const parsed = createWarehouseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const existing = await prisma.warehouse.findFirst({ where: { companyId, name: data.name } });
    if (existing) {
      return NextResponse.json({ error: "Bu adda anbar artıq mövcuddur" }, { status: 409 });
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name: data.name,
        location: data.location || null,
        type: data.type || "MAIN",
        companyId,
      },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "CREATE",
      entityType: "WAREHOUSE",
      entityId: warehouse.id,
      entityName: warehouse.name,
    });

    return NextResponse.json({ ...warehouse, zones: [], totalQuantity: 0 }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/inventory/warehouses]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
