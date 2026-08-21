import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// =============================================================================
// GET /api/calls/[id] — Zəng + kanal + zəng edən məlumatı
// =============================================================================

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const userId = session.user.id as string;
    const { id } = await params;

    const call = await prisma.call.findUnique({
      where: { id },
      include: {
        caller: { select: { id: true, name: true, avatar: true } },
        channel: {
          include: {
            members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
          },
        },
      },
    });

    if (!call) return NextResponse.json({ error: "Zəng tapılmadı" }, { status: 404 });

    const isMember = call.channel.members.some((m) => m.userId === userId);
    if (!isMember) return NextResponse.json({ error: "Qadağandır" }, { status: 403 });

    return NextResponse.json(call);
  } catch (error) {
    console.error("[CALL_GET]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

// =============================================================================
// PATCH /api/calls/[id] — Status dəyiş (ACTIVE / ENDED / DECLINED / MISSED)
// =============================================================================

const ALLOWED_STATUSES = ["ACTIVE", "ENDED", "DECLINED", "MISSED"];

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const userId = session.user.id as string;
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Yanlış status" }, { status: 400 });
    }

    const call = await prisma.call.findUnique({
      where: { id },
      include: {
        channel: { include: { members: true } },
      },
    });

    if (!call) return NextResponse.json({ error: "Zəng tapılmadı" }, { status: 404 });

    const isMember = call.channel.members.some((m) => m.userId === userId);
    if (!isMember) return NextResponse.json({ error: "Qadağandır" }, { status: 403 });

    // Yalnız zəng edən özü zəngi ACTIVE edə bilməz — bunu yalnız qəbul edən edə bilər
    if (status === "ACTIVE" && call.callerId === userId) {
      return NextResponse.json({ error: "Qadağandır" }, { status: 403 });
    }

    const updated = await prisma.call.update({
      where: { id },
      data: {
        status,
        ...(status === "ENDED" || status === "DECLINED" || status === "MISSED"
          ? { endedAt: new Date() }
          : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[CALL_PATCH]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
