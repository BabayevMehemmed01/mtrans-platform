import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isChatGroupAdmin } from "@/lib/chat-admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function pinExpiryFromDuration(duration?: string | null) {
  if (duration === "24h") return new Date(Date.now() + 24 * 60 * 60 * 1000);
  if (duration === "7d") return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return null;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("İcazə yoxdur", { status: 401 });

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const isPinned = Boolean(body.isPinned);
    const pinDuration = typeof body.pinDuration === "string" ? body.pinDuration : null;

    const message = await prisma.message.findUnique({ where: { id } });
    if (!message) return new NextResponse("Tapılmadı", { status: 404 });

    const membership = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId: message.channelId, userId: session.user.id } },
    });
    if (!membership) return new NextResponse("Qadağandır", { status: 403 });

    if (isPinned) {
      await prisma.$transaction([
        prisma.message.updateMany({
          where: { channelId: message.channelId, isPinned: true },
          data: { isPinned: false, pinExpiry: null },
        }),
        prisma.message.update({
          where: { id },
          data: {
            isPinned: true,
            pinExpiry: pinExpiryFromDuration(pinDuration),
          },
        }),
      ]);
    } else {
      await prisma.message.update({
        where: { id },
        data: { isPinned: false, pinExpiry: null },
      });
    }

    const updated = await prisma.message.findUnique({
      where: { id },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[CHAT_MESSAGE_PATCH]", error);
    return new NextResponse("Server xətası", { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("İcazə yoxdur", { status: 401 });

    const { id } = await params;
    const message = await prisma.message.findUnique({ where: { id } });
    if (!message) return new NextResponse("Tapılmadı", { status: 404 });

    const membership = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId: message.channelId, userId: session.user.id } },
    });
    if (!membership) return new NextResponse("Qadağandır", { status: 403 });

    const isOwner = message.senderId === session.user.id;
    const isAdmin = await isChatGroupAdmin(session.user.id, message.channelId);
    if (!isOwner && !isAdmin) return new NextResponse("Qadağandır", { status: 403 });

    await prisma.message.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CHAT_MESSAGE_DELETE]", error);
    return new NextResponse("Server xətası", { status: 500 });
  }
}
