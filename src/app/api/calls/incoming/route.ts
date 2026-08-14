import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// =============================================================================
// GET /api/calls/incoming — Cari istifadəçi üçün gələn (RINGING) zəngi tap
// Qlobal poller tərəfindən çağırılır (CallOverlay)
// =============================================================================

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id as string;

    // Köhnə/asılı qalmış zəngləri canlandırmamaq üçün son 60 saniyə pəncərəsi
    const recentWindow = new Date(Date.now() - 60 * 1000);

    const call = await prisma.call.findFirst({
      where: {
        status: "RINGING",
        startedAt: { gte: recentWindow },
        callerId: { not: userId },
        channel: {
          members: { some: { userId } },
        },
      },
      include: {
        caller: { select: { id: true, name: true, avatar: true } },
        channel: {
          select: { id: true, name: true, type: true },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    return NextResponse.json({ call: call ?? null });
  } catch (error) {
    console.error("[CALLS_INCOMING_GET]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
