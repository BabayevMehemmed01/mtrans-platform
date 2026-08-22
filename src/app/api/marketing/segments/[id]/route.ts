import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateMarketingSegmentSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;

    const { id } = await params;
    const segment = await prisma.marketingSegment.findFirst({
      where: { id, companyId },
      include: { _count: { select: { campaigns: true } } },
    });
    if (!segment) return NextResponse.json({ error: "Seqment tapılmadı" }, { status: 404 });

    return NextResponse.json(segment);
  } catch (error) {
    console.error("[GET /api/marketing/segments/:id]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;

    const { id } = await params;
    const existing = await prisma.marketingSegment.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Seqment tapılmadı" }, { status: 404 });

    const body = await req.json();
    const parsed = updateMarketingSegmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    let customerIds = data.customerIds;
    if (customerIds && customerIds.length > 0) {
      const validCustomers = await prisma.customer.findMany({
        where: { id: { in: customerIds }, companyId },
        select: { id: true },
      });
      customerIds = validCustomers.map((c) => c.id);
    }

    const updated = await prisma.marketingSegment.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.filters !== undefined && { filters: data.filters as Prisma.InputJsonValue }),
        ...(customerIds !== undefined && { customerIds }),
        ...(data.customRecipients !== undefined && {
          customRecipients: data.customRecipients as Prisma.InputJsonValue,
        }),
      },
      include: { _count: { select: { campaigns: true } } },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "UPDATE",
      entityType: "MARKETING_SEGMENT",
      entityId: updated.id,
      entityName: updated.name,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/marketing/segments/:id]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;

    const { id } = await params;
    const existing = await prisma.marketingSegment.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Seqment tapılmadı" }, { status: 404 });

    await prisma.marketingSegment.delete({ where: { id } });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "DELETE",
      entityType: "MARKETING_SEGMENT",
      entityId: existing.id,
      entityName: existing.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/marketing/segments/:id]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
