import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSupplierSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

// =============================================================================
// GET  /api/inventory/suppliers — Təchizatçı siyahısı (axtarış + aktiv filteri)
// POST /api/inventory/suppliers — Yeni təchizatçı yarat
// =============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const includeInactive = searchParams.get("includeInactive") === "1";

    const suppliers = await prisma.supplier.findMany({
      where: {
        companyId,
        ...(includeInactive ? {} : { isActive: true }),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { contactName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        _count: { select: { purchaseOrders: true, stockMovements: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("[GET /api/inventory/suppliers]", error);
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
    const parsed = createSupplierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const existing = await prisma.supplier.findFirst({ where: { companyId, name: data.name.trim() } });
    if (existing) {
      return NextResponse.json({ error: "Bu adda təchizatçı artıq mövcuddur" }, { status: 409 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: data.name.trim(),
        contactName: data.contactName || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        taxId: data.taxId || null,
        companyId,
      },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "CREATE",
      entityType: "SUPPLIER",
      entityId: supplier.id,
      entityName: supplier.name,
    });

    return NextResponse.json({ ...supplier, _count: { purchaseOrders: 0, stockMovements: 0 } }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/inventory/suppliers]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
