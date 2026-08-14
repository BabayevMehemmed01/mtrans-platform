import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// =============================================================================
// GET /api/members — Şirkətin real (aktiv/deaktiv/bloklanmış) istifadəçilərini qaytarır
// Yeni üzv əlavə etmək artıq bu route-dan deyil, /api/invites vasitəsilə (email-invite
// axını) həyata keçirilir — bax: src/app/api/invites/route.ts
// =============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const companyId = (session.user as any).companyId;

    const members = await prisma.user.findMany({
      where: { companyId },
      include: {
        department: { select: { id: true, name: true, color: true } },
        role: { select: { id: true, name: true, color: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("[GET /api/members]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

