import { prisma } from "@/lib/prisma";
import type { Prisma, StockMovementType } from "@prisma/client";
import type { StockMovementLineInput } from "@/lib/validations";

// =============================================================================
// Inventory Service — WMS-in "beyni". Stok hərəkətlərinin (StockMovement)
// InventoryLevel qalıqlarına real-time, tranzaksiya-təhlükəsiz tətbiqi və
// analitika (ABC, dövriyyə, real-time cəmi) aqreqasiyaları bu modulda yaşayır.
// Heç bir mock data yoxdur — bütün rəqəmlər Prisma sorğularından gəlir.
// =============================================================================

export class InsufficientStockError extends Error {
  readonly statusCode = 409;
  constructor(productId: string, available: number, requested: number) {
    super(
      `Kifayət qədər stok yoxdur (Məhsul: ${productId}). Mövcud: ${available}, tələb olunan: ${requested}`
    );
  }
}

type TxClient = Prisma.TransactionClient;

/** Bir bin/anbar üzrə InventoryLevel-ə "delta" (müsbət/mənfi) tətbiq edir. */
async function adjustLevel(
  tx: TxClient,
  params: {
    productId: string;
    warehouseId: string;
    binId?: string | null;
    lotNumber?: string | null;
    delta: number;
    expiryDate?: Date | null;
  }
) {
  const { productId, warehouseId, delta } = params;
  const binId = params.binId ?? null;
  const lotNumber = params.lotNumber ?? null;

  const existing = await tx.inventoryLevel.findFirst({
    where: { productId, warehouseId, binId, lotNumber },
  });

  if (existing) {
    const nextQty = existing.quantity + delta;
    if (nextQty < -1e-6) {
      throw new InsufficientStockError(productId, existing.quantity, -delta);
    }
    return tx.inventoryLevel.update({
      where: { id: existing.id },
      data: {
        quantity: Math.max(0, nextQty),
        ...(params.expiryDate ? { expiryDate: params.expiryDate } : {}),
      },
    });
  }

  if (delta < 0) {
    throw new InsufficientStockError(productId, 0, -delta);
  }

  return tx.inventoryLevel.create({
    data: {
      productId,
      warehouseId,
      binId,
      lotNumber,
      quantity: delta,
      expiryDate: params.expiryDate ?? null,
    },
  });
}

/** StockMovement tipinə əsasən InventoryLevel-ə düzgün istiqamətdə təsir edir. */
async function applyMovementEffect(
  tx: TxClient,
  movement: {
    type: StockMovementType;
    productId: string;
    quantity: number;
    fromWarehouseId: string | null;
    toWarehouseId: string | null;
    fromBinId: string | null;
    toBinId: string | null;
    lotNumber: string | null;
    expiryDate: Date | null;
  }
) {
  const { type, productId, quantity, lotNumber, expiryDate } = movement;

  switch (type) {
    case "INBOUND": {
      if (!movement.toWarehouseId) throw new Error("INBOUND üçün hədəf anbar (toWarehouseId) tələb olunur");
      await adjustLevel(tx, {
        productId,
        warehouseId: movement.toWarehouseId,
        binId: movement.toBinId,
        lotNumber,
        delta: Math.abs(quantity),
        expiryDate,
      });
      break;
    }
    case "OUTBOUND":
    case "SCRAP": {
      if (!movement.fromWarehouseId) throw new Error(`${type} üçün mənbə anbar (fromWarehouseId) tələb olunur`);
      await adjustLevel(tx, {
        productId,
        warehouseId: movement.fromWarehouseId,
        binId: movement.fromBinId,
        lotNumber,
        delta: -Math.abs(quantity),
      });
      break;
    }
    case "TRANSFER": {
      if (!movement.fromWarehouseId || !movement.toWarehouseId) {
        throw new Error("TRANSFER üçün həm mənbə, həm də hədəf anbar tələb olunur");
      }
      await adjustLevel(tx, {
        productId,
        warehouseId: movement.fromWarehouseId,
        binId: movement.fromBinId,
        lotNumber,
        delta: -Math.abs(quantity),
      });
      await adjustLevel(tx, {
        productId,
        warehouseId: movement.toWarehouseId,
        binId: movement.toBinId,
        lotNumber,
        delta: Math.abs(quantity),
        expiryDate,
      });
      break;
    }
    case "ADJUSTMENT": {
      // Tənzimləmə (inventarlaşdırma / ilkin qalıq) — quantity işarəli ola bilər.
      const warehouseId = movement.toWarehouseId ?? movement.fromWarehouseId;
      if (!warehouseId) throw new Error("ADJUSTMENT üçün anbar tələb olunur");
      await adjustLevel(tx, {
        productId,
        warehouseId,
        binId: movement.toBinId ?? movement.fromBinId,
        lotNumber,
        delta: quantity,
        expiryDate,
      });
      break;
    }
  }
}

/** "STA-00001" tərzi ardıcıl sənəd nömrəsi generasiyası. */
export async function generateDocumentReference(companyId: string, prefix: string): Promise<string> {
  const count = await prisma.stockMovement.count({
    where: { companyId, reference: { startsWith: `${prefix}-` } },
  });
  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

export interface CreateStockMovementDocumentParams {
  companyId: string;
  createdById: string;
  type: StockMovementType;
  status: "DRAFT" | "COMPLETED";
  reference?: string | null;
  comment?: string | null;
  currency?: string;
  lines: StockMovementLineInput[];
}

/**
 * Bir "sənəd" altında bir və ya bir neçə StockMovement sətri yaradır. Status
 * COMPLETED olduqda, bütün sətirlər AYNI $transaction daxilində InventoryLevel-ə
 * tətbiq olunur (hamısı və ya heç biri — atomiklik).
 */
export async function createStockMovementDocument(params: CreateStockMovementDocumentParams) {
  const { companyId, createdById, type, status, comment, currency = "AZN" } = params;
  const reference = params.reference?.trim() || (await generateDocumentReference(companyId, documentPrefixFor(type)));

  return prisma.$transaction(async (tx) => {
    const created = [];

    for (const line of params.lines) {
      const unitCost = line.unitCost ?? 0;
      const unitPrice = line.unitPrice ?? 0;
      const quantity = Number(line.quantity);
      const totalAmount = Math.abs(quantity) * (unitCost || unitPrice);

      const movement = await tx.stockMovement.create({
        data: {
          type,
          status,
          reference,
          comment: comment || null,
          currency,
          quantity,
          unitCost,
          unitPrice,
          totalAmount,
          lotNumber: line.lotNumber || null,
          expiryDate: line.expiryDate ? new Date(line.expiryDate) : null,
          processedAt: status === "COMPLETED" ? new Date() : null,
          companyId,
          productId: line.productId,
          fromWarehouseId: line.fromWarehouseId || null,
          toWarehouseId: line.toWarehouseId || null,
          fromBinId: line.fromBinId || null,
          toBinId: line.toBinId || null,
          createdById,
        },
        include: {
          product: { select: { id: true, name: true, sku: true, unit: true } },
          fromWarehouse: { select: { id: true, name: true } },
          toWarehouse: { select: { id: true, name: true } },
        },
      });

      if (status === "COMPLETED") {
        await applyMovementEffect(tx, {
          type,
          productId: movement.productId,
          quantity: movement.quantity,
          fromWarehouseId: movement.fromWarehouseId,
          toWarehouseId: movement.toWarehouseId,
          fromBinId: movement.fromBinId,
          toBinId: movement.toBinId,
          lotNumber: movement.lotNumber,
          expiryDate: movement.expiryDate,
        });
      }

      created.push(movement);
    }

    return { reference, movements: created };
  });
}

/** Draft statusundaki sənədi indi icra edir (qalıqlara tətbiq edir). */
export async function processStockMovement(id: string, companyId: string) {
  return prisma.$transaction(async (tx) => {
    const movement = await tx.stockMovement.findFirst({ where: { id, companyId } });
    if (!movement) throw new Error("Stok hərəkəti tapılmadı");
    if (movement.status === "COMPLETED") return movement;

    await applyMovementEffect(tx, {
      type: movement.type,
      productId: movement.productId,
      quantity: movement.quantity,
      fromWarehouseId: movement.fromWarehouseId,
      toWarehouseId: movement.toWarehouseId,
      fromBinId: movement.fromBinId,
      toBinId: movement.toBinId,
      lotNumber: movement.lotNumber,
      expiryDate: movement.expiryDate,
    });

    return tx.stockMovement.update({
      where: { id },
      data: { status: "COMPLETED", processedAt: new Date() },
    });
  });
}

function documentPrefixFor(type: StockMovementType): string {
  switch (type) {
    case "ADJUSTMENT":
      return "STA";
    case "TRANSFER":
      return "TRF";
    case "SCRAP":
      return "WOF";
    case "INBOUND":
      return "INB";
    case "OUTBOUND":
      return "OUT";
    default:
      return "DOC";
  }
}

// =============================================================================
// ANALYTICS — ABC analizi, stok dövriyyəsi, real-time qalıq
// =============================================================================

export interface RealtimeTotals {
  totalProducts: number;
  totalQuantity: number;
  totalValuation: number;
  lowStockCount: number;
  warehouseCount: number;
}

export async function getRealtimeTotals(companyId: string): Promise<RealtimeTotals> {
  const [products, levels, warehouseCount] = await Promise.all([
    prisma.product.findMany({
      where: { companyId, isActive: true },
      select: { id: true, purchasePrice: true, minStockLimit: true },
    }),
    prisma.inventoryLevel.findMany({
      where: { product: { companyId } },
      select: { productId: true, quantity: true },
    }),
    prisma.warehouse.count({ where: { companyId } }),
  ]);

  const qtyByProduct = new Map<string, number>();
  for (const level of levels) {
    qtyByProduct.set(level.productId, (qtyByProduct.get(level.productId) ?? 0) + level.quantity);
  }

  let totalQuantity = 0;
  let totalValuation = 0;
  let lowStockCount = 0;

  for (const product of products) {
    const qty = qtyByProduct.get(product.id) ?? 0;
    totalQuantity += qty;
    totalValuation += qty * product.purchasePrice;
    if (product.minStockLimit > 0 && qty < product.minStockLimit) lowStockCount++;
  }

  return {
    totalProducts: products.length,
    totalQuantity,
    totalValuation,
    lowStockCount,
    warehouseCount,
  };
}

export interface AbcAnalysisRow {
  productId: string;
  sku: string;
  name: string;
  value: number;
  percentOfTotal: number;
  cumulativePercent: number;
  category: "A" | "B" | "C";
}

/**
 * ABC analizi: son `days` gündə OUTBOUND/SCRAP hərəkətlərinin dəyərinə (quantity × unitCost)
 * görə məhsulları sıralayır. Hərəkət tarixçəsi olmayan yeni quraşdırmalarda, hazırkı
 * anbar dəyərinə (qalıq × alış qiyməti) əsasən fallback edir.
 */
export async function getAbcAnalysis(companyId: string, days = 90): Promise<AbcAnalysisRow[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const movements = await prisma.stockMovement.groupBy({
    by: ["productId"],
    where: {
      companyId,
      status: "COMPLETED",
      type: { in: ["OUTBOUND", "SCRAP"] },
      createdAt: { gte: since },
    },
    _sum: { totalAmount: true },
  });

  let valueByProduct = new Map<string, number>(
    movements.map((m) => [m.productId, m._sum.totalAmount ?? 0])
  );

  const usingFallback = movements.length === 0;
  if (usingFallback) {
    const [products, levels] = await Promise.all([
      prisma.product.findMany({ where: { companyId, isActive: true }, select: { id: true, purchasePrice: true } }),
      prisma.inventoryLevel.findMany({ where: { product: { companyId } }, select: { productId: true, quantity: true } }),
    ]);
    const qtyByProduct = new Map<string, number>();
    for (const l of levels) qtyByProduct.set(l.productId, (qtyByProduct.get(l.productId) ?? 0) + l.quantity);
    valueByProduct = new Map(
      products.map((p) => [p.id, (qtyByProduct.get(p.id) ?? 0) * p.purchasePrice])
    );
  }

  const productIds = Array.from(valueByProduct.keys());
  if (productIds.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, sku: true, name: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const rows = productIds
    .map((productId) => ({ productId, value: valueByProduct.get(productId) ?? 0 }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = rows.reduce((sum, r) => sum + r.value, 0) || 1;

  let cumulative = 0;
  return rows.map((r) => {
    const percentOfTotal = (r.value / total) * 100;
    cumulative += percentOfTotal;
    const category: "A" | "B" | "C" = cumulative <= 80 ? "A" : cumulative <= 95 ? "B" : "C";
    const product = productMap.get(r.productId);
    return {
      productId: r.productId,
      sku: product?.sku ?? "—",
      name: product?.name ?? "—",
      value: r.value,
      percentOfTotal,
      cumulativePercent: Math.min(100, cumulative),
      category,
    };
  });
}

export interface TurnoverRow {
  productId: string;
  sku: string;
  name: string;
  outboundQuantity: number;
  averageInventory: number;
  turnoverRatio: number;
}

/** Stok dövriyyəsi = son `days` gündəki OUTBOUND/SCRAP miqdarı / hazırkı orta qalıq. */
export async function getStockTurnover(companyId: string, days = 90): Promise<TurnoverRow[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [outbound, levels, products] = await Promise.all([
    prisma.stockMovement.groupBy({
      by: ["productId"],
      where: {
        companyId,
        status: "COMPLETED",
        type: { in: ["OUTBOUND", "SCRAP"] },
        createdAt: { gte: since },
      },
      _sum: { quantity: true },
    }),
    prisma.inventoryLevel.findMany({ where: { product: { companyId } }, select: { productId: true, quantity: true } }),
    prisma.product.findMany({ where: { companyId, isActive: true }, select: { id: true, sku: true, name: true } }),
  ]);

  const qtyByProduct = new Map<string, number>();
  for (const l of levels) qtyByProduct.set(l.productId, (qtyByProduct.get(l.productId) ?? 0) + l.quantity);

  const outboundByProduct = new Map(outbound.map((o) => [o.productId, Math.abs(o._sum.quantity ?? 0)]));
  const productMap = new Map(products.map((p) => [p.id, p]));

  const relevantIds = new Set<string>([...outboundByProduct.keys(), ...qtyByProduct.keys()]);

  return Array.from(relevantIds)
    .map((productId) => {
      const product = productMap.get(productId);
      const outboundQuantity = outboundByProduct.get(productId) ?? 0;
      const averageInventory = qtyByProduct.get(productId) ?? 0;
      const turnoverRatio = averageInventory > 0 ? outboundQuantity / averageInventory : 0;
      return {
        productId,
        sku: product?.sku ?? "—",
        name: product?.name ?? "—",
        outboundQuantity,
        averageInventory,
        turnoverRatio,
      };
    })
    .filter((r) => productMap.has(r.productId))
    .sort((a, b) => b.turnoverRatio - a.turnoverRatio);
}
