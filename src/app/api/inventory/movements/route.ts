import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createStockMovementDocumentSchema, stockMovementTypeEnum, stockMovementStatusEnum } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import { createStockMovementDocument, InsufficientStockError } from "@/lib/inventoryService";

// =============================================================================
// GET /api/inventory/movements — Stok hərəkətləri siyahısı (Transfers/Write-offs/
//   Sales-orders tabları eyni endpoint-dən ?type= filteri ilə istifadə edir).
// POST /api/inventory/movements — Yeni stok hərəkəti sənədi (1..N sətir) yaradır.
//   Prisma $transaction ilə: bütün sətirlər YA hamısı yaradılır və (COMPLETED
//   olduqda) qalıqlara tətbiq olunur, YA da heç biri (atomiklik təmin olunur).
// =============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const typesParam = searchParams.get("type"); // "TRANSFER" və ya "SCRAP,ADJUSTMENT" formatında
    const statusParam = searchParams.get("status");
    const reference = searchParams.get("reference")?.trim();
    const productId = searchParams.get("productId")?.trim();
    const limit = Math.min(Number(searchParams.get("limit")) || 100, 300);

    const types = typesParam
      ?.split(",")
      .map((t) => stockMovementTypeEnum.safeParse(t.trim()))
      .filter((r) => r.success)
      .map((r) => r.data);

    const status = stockMovementStatusEnum.safeParse(statusParam);

    const movements = await prisma.stockMovement.findMany({
      where: {
        companyId,
        ...(types && types.length > 0 ? { type: { in: types } } : {}),
        ...(status.success ? { status: status.data } : {}),
        ...(reference ? { reference: { contains: reference, mode: "insensitive" } } : {}),
        ...(productId ? { productId } : {}),
      },
      include: {
        product: { select: { id: true, name: true, sku: true, unit: true, barcode: true } },
        fromWarehouse: { select: { id: true, name: true } },
        toWarehouse: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(movements);
  } catch (error) {
    console.error("[GET /api/inventory/movements]", error);
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
    const parsed = createStockMovementDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // Bütün məhsul/anbar ID-lərinin bu şirkətə aid olduğunu doğrula.
    const productIds = Array.from(new Set(data.lines.map((l) => l.productId)));
    const warehouseIds = Array.from(
      new Set(data.lines.flatMap((l) => [l.fromWarehouseId, l.toWarehouseId]).filter(Boolean) as string[])
    );

    const [validProducts, validWarehouses] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: productIds }, companyId }, select: { id: true } }),
      warehouseIds.length > 0
        ? prisma.warehouse.findMany({ where: { id: { in: warehouseIds }, companyId }, select: { id: true } })
        : Promise.resolve([]),
    ]);

    if (validProducts.length !== productIds.length) {
      return NextResponse.json({ error: "Seçilmiş məhsullardan bəzisi tapılmadı" }, { status: 400 });
    }
    if (validWarehouses.length !== warehouseIds.length) {
      return NextResponse.json({ error: "Seçilmiş anbarlardan bəzisi tapılmadı" }, { status: 400 });
    }

    const result = await createStockMovementDocument({
      companyId,
      createdById: session.user.id,
      type: data.type,
      status: data.status ?? "DRAFT",
      reference: data.reference,
      comment: data.comment,
      currency: data.currency,
      lines: data.lines,
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "CREATE",
      entityType: "STOCK_MOVEMENT",
      entityId: result.movements[0]?.id ?? result.reference,
      entityName: result.reference,
      metadata: { type: data.type, status: data.status ?? "DRAFT", lineCount: data.lines.length },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[POST /api/inventory/movements]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server xətası" }, { status: 500 });
  }
}
