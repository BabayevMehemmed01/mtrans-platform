import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMarketingCampaignSchema, campaignTypeEnum } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

// =============================================================================
// GET /api/marketing/campaigns — Şirkətin bütün kampaniyaları (Campaigns / Ads tabları)
// POST /api/marketing/campaigns — Yeni kampaniya yarat (DRAFT status ilə başlayır)
// =============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const companyId = (session.user as any).companyId;
    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get("type");
    const parsedType = campaignTypeEnum.safeParse(typeParam);

    const campaigns = await prisma.marketingCampaign.findMany({
      where: {
        companyId,
        ...(parsedType.success ? { type: parsedType.data } : {}),
      },
      include: {
        segment: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("[GET /api/marketing/campaigns]", error);
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
    const parsed = createMarketingCampaignSchema.safeParse(body);
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
      if (!segment) {
        return NextResponse.json({ error: "Seçilmiş seqment tapılmadı" }, { status: 400 });
      }
    }

    const campaign = await prisma.marketingCampaign.create({
      data: {
        name: data.name,
        type: data.type,
        status: data.status || "DRAFT",
        subject: data.subject || null,
        content: data.content || null,
        segmentId: data.segmentId || null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        companyId,
        createdById: session.user.id,
      },
      include: {
        segment: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, avatar: true } },
      },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "CREATE",
      entityType: "MARKETING_CAMPAIGN",
      entityId: campaign.id,
      entityName: campaign.name,
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("[POST /api/marketing/campaigns]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
