import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// =============================================================================
// PATCH /api/notifications/[id]  — Tək bildirişi oxunmuş kimi işarələ
// =============================================================================

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id as string;
    const { id } = await params;

    const notification = await prisma.notification.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!notification) {
      return NextResponse.json({ error: "Bildiriş tapılmadı" }, { status: 404 });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/notifications/[id]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
