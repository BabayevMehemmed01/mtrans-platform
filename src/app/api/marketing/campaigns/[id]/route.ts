import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateMarketingCampaignSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;

    const { id } = await params;
    const campaign = await prisma.marketingCampaign.findFirst({
      where: { id, companyId },
      include: {
        segment: { select: { id: true, name: true, customerIds: true, customRecipients: true } },
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
    });
    if (!campaign) return NextResponse.json({ error: "Kampaniya tapılmadı" }, { status: 404 });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("[GET /api/marketing/campaigns/:id]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;

    const { id } = await params;
    const existing = await prisma.marketingCampaign.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Kampaniya tapılmadı" }, { status: 404 });

    const body = await req.json();
    const parsed = updateMarketingCampaignSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    if (data.segmentId) {
      const segment = await prisma.marketingSegment.findFirst({
        where: { id: data.segmentId, companyId },
      });
      if (!segment) return NextResponse.json({ error: "Seçilmiş seqment tapılmadı" }, { status: 400 });
    }

    const updated = await prisma.marketingCampaign.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.subject !== undefined && { subject: data.subject || null }),
        ...(data.content !== undefined && { content: data.content || null }),
        ...(data.segmentId !== undefined && { segmentId: data.segmentId || null }),
        ...(data.scheduledAt !== undefined && {
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        }),
      },
      include: {
        segment: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "UPDATE",
      entityType: "MARKETING_CAMPAIGN",
      entityId: updated.id,
      entityName: updated.name,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/marketing/campaigns/:id]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;

    const { id } = await params;
    const existing = await prisma.marketingCampaign.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Kampaniya tapılmadı" }, { status: 404 });

    await prisma.marketingCampaign.delete({ where: { id } });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "DELETE",
      entityType: "MARKETING_CAMPAIGN",
      entityId: existing.id,
      entityName: existing.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/marketing/campaigns/:id]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
