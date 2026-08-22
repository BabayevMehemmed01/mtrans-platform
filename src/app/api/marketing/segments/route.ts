import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMarketingSegmentSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

// =============================================================================
// GET /api/marketing/segments — Şirkətin bütün auditoriya seqmentləri
// POST /api/marketing/segments — Yeni seqment yarat (mövcud müştərilər + statik siyahı)
// =============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;

    const segments = await prisma.marketingSegment.findMany({
      where: { companyId },
      include: { _count: { select: { campaigns: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(segments);
  } catch (error) {
    console.error("[GET /api/marketing/segments]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = createMarketingSegmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    let customerIds = data.customerIds ?? [];
    if (customerIds.length > 0) {
      const validCustomers = await prisma.customer.findMany({
        where: { id: { in: customerIds }, companyId },
        select: { id: true },
      });
      customerIds = validCustomers.map((c) => c.id);
    }

    const customRecipients = (data.customRecipients ?? []).filter(
      (r) => (r.email && r.email.trim()) || (r.phone && r.phone.trim())
    );

    const segment = await prisma.marketingSegment.create({
      data: {
        name: data.name,
        filters: (data.filters ?? {}) as Prisma.InputJsonValue,
        customerIds,
        customRecipients: customRecipients as Prisma.InputJsonValue,
        companyId,
      },
      include: { _count: { select: { campaigns: true } } },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "CREATE",
      entityType: "MARKETING_SEGMENT",
      entityId: segment.id,
      entityName: segment.name,
    });

    return NextResponse.json(segment, { status: 201 });
  } catch (error) {
    console.error("[POST /api/marketing/segments]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
