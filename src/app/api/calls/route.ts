import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// =============================================================================
// POST /api/calls — Yeni zəng başlat (1:1 audio/video, kanal üzvlüyü şərtdir)
// =============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id as string;
    const body = await req.json();
    const { channelId, type } = body;

    if (!channelId) return NextResponse.json({ error: "channelId tələb olunur" }, { status: 400 });
    if (type !== "AUDIO" && type !== "VIDEO") {
      return NextResponse.json({ error: "type AUDIO və ya VIDEO olmalıdır" }, { status: 400 });
    }

    // Tenant/membership yoxlaması — kanala üzv olmayan zəng başlada bilməz
    const membership = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
    });
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Yalnız 1:1 zəng dəstəklənir — kanalda tam 2 üzv olmalıdır
    const memberCount = await prisma.channelMember.count({ where: { channelId } });
    if (memberCount !== 2) {
      return NextResponse.json({ error: "Zəng yalnız iki nəfərlik söhbətlərdə mümkündür" }, { status: 400 });
    }

    // Kanalda artıq davam edən zəng varsa yenisini yaratma
    const existingActive = await prisma.call.findFirst({
      where: { channelId, status: { in: ["RINGING", "ACTIVE"] } },
    });
    if (existingActive) {
      return NextResponse.json({ error: "Bu kanalda artıq aktiv zəng var" }, { status: 409 });
    }

    const call = await prisma.call.create({
      data: {
        channelId,
        type,
        status: "RINGING",
        callerId: userId,
      },
      include: {
        caller: { select: { id: true, name: true, avatar: true } },
        channel: {
          include: {
            members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
          },
        },
      },
    });

    return NextResponse.json(call);
  } catch (error) {
    console.error("[CALLS_POST]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
