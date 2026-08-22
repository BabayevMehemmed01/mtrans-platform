import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dispatchCampaign, MarketingChannelInactiveError } from "@/lib/marketingService";
import { logAudit } from "@/lib/audit";

// =============================================================================
// POST /api/marketing/campaigns/:id/send — Kampaniyayı dərhal yayımlayır.
// Kanal (.env) aktiv deyilsə 409 qaytarır ki, UI "Quraşdırma tələb olunur"
// xəbərdarlığını göstərsin.
// =============================================================================

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;

    const { id } = await params;
    const existing = await prisma.marketingCampaign.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Kampaniya tapılmadı" }, { status: 404 });

    if (existing.status === "COMPLETED") {
      return NextResponse.json({ error: "Bu kampaniya artıq tamamlanıb" }, { status: 400 });
    }

    const updated = await dispatchCampaign(id, companyId);

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "UPDATE",
      entityType: "MARKETING_CAMPAIGN",
      entityId: updated.id,
      entityName: updated.name,
      metadata: { action: "SEND", stats: updated.stats as Prisma.InputJsonValue },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof MarketingChannelInactiveError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[POST /api/marketing/campaigns/:id/send]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
