import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createProductSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

// =============================================================================
// GET /api/inventory/products — Məhsul kataloqu: axtarış (ad/SKU/barkod), kateqoriya
//   filteri, barkod ilə dəqiq axtarış (?barcode=), aşağı qalıq filteri (?lowStock=1).
// POST /api/inventory/products — Yeni məhsul yarat (kataloqa əlavə et)
// =============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const barcode = searchParams.get("barcode")?.trim();
    const category = searchParams.get("category")?.trim();
    const includeInactive = searchParams.get("includeInactive") === "1";
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

    // Barkod skaneri ilə dəqiq axtarış — bir ədəd (və ya heç biri) qaytarır.
    if (barcode) {
      const product = await prisma.product.findFirst({
        where: { companyId, barcode },
        include: { inventoryLevels: { select: { quantity: true, warehouseId: true } } },
      });
      if (!product) return NextResponse.json({ error: "Bu barkodla məhsul tapılmadı" }, { status: 404 });
      return NextResponse.json({ ...product, totalQuantity: product.inventoryLevels.reduce((s, l) => s + l.quantity, 0) });
    }

    const products = await prisma.product.findMany({
      where: {
        companyId,
        ...(includeInactive ? {} : { isActive: true }),
        ...(category ? { category } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
                { barcode: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        inventoryLevels: { select: { quantity: true, warehouseId: true } },
      },
      orderBy: { name: "asc" },
      take: limit,
    });

    const result = products.map((p) => {
      const { inventoryLevels, ...rest } = p;
      return {
        ...rest,
        totalQuantity: inventoryLevels.reduce((sum, l) => sum + l.quantity, 0),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[GET /api/inventory/products]", error);
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
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const existingSku = await prisma.product.findFirst({ where: { companyId, sku: data.sku } });
    if (existingSku) {
      return NextResponse.json({ error: "Bu SKU artıq mövcuddur" }, { status: 409 });
    }

    const product = await prisma.product.create({
      data: {
        sku: data.sku,
        barcode: data.barcode || null,
        name: data.name,
        category: data.category || null,
        unit: data.unit || "pcs",
        minStockLimit: data.minStockLimit ?? 0,
        purchasePrice: data.purchasePrice ?? 0,
        salesPrice: data.salesPrice ?? 0,
        isTrackedByBatch: data.isTrackedByBatch ?? false,
        companyId,
      },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "CREATE",
      entityType: "PRODUCT",
      entityId: product.id,
      entityName: product.name,
    });

    return NextResponse.json({ ...product, totalQuantity: 0 }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/inventory/products]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
