import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const ALLOWED_TYPES = ["offer", "answer", "ice-candidate", "hangup", "decline"];

async function assertMembership(callId: string, userId: string) {
  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: { channel: { include: { members: true } } },
  });
  if (!call) return { call: null, isMember: false };
  const isMember = call.channel.members.some((m) => m.userId === userId);
  return { call, isMember };
}

// =============================================================================
// POST /api/calls/[id]/signals — Siqnal göndər (offer/answer/ice-candidate/hangup/decline)
// =============================================================================

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id as string;
    const { id } = await params;
    const body = await req.json();
    const { type, payload } = body;

    if (!type || !ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: "Yanlış siqnal tipi" }, { status: 400 });
    }

    const { call, isMember } = await assertMembership(id, userId);
    if (!call) return NextResponse.json({ error: "Zəng tapılmadı" }, { status: 404 });
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const signal = await prisma.callSignal.create({
      data: {
        callId: id,
        senderId: userId,
        type,
        payload: payload ?? {},
      },
    });

    return NextResponse.json(signal);
  } catch (error) {
    console.error("[CALL_SIGNALS_POST]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

// =============================================================================
// GET /api/calls/[id]/signals?after=<ISO timestamp və ya signal id>
// Yalnız qarşı tərəfin siqnallarını qaytarır (öz göndərdiklərini istisna edir)
// =============================================================================

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id as string;
    const { id } = await params;

    const { call, isMember } = await assertMembership(id, userId);
    if (!call) return NextResponse.json({ error: "Zəng tapılmadı" }, { status: 404 });
    if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const after = searchParams.get("after");

    let afterDate: Date | null = null;
    if (after) {
      const parsed = new Date(after);
      if (!isNaN(parsed.getTime())) {
        afterDate = parsed;
      } else {
        // Ola bilsin cursor bir signal id-dir — həmin siqnalın createdAt-ını tap
        const cursorSignal = await prisma.callSignal.findUnique({ where: { id: after } });
        if (cursorSignal) afterDate = cursorSignal.createdAt;
      }
    }

    const signals = await prisma.callSignal.findMany({
      where: {
        callId: id,
        senderId: { not: userId },
        ...(afterDate ? { createdAt: { gt: afterDate } } : {}),
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(signals);
  } catch (error) {
    console.error("[CALL_SIGNALS_GET]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
