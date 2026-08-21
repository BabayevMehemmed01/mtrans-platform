import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isChatGroupAdmin } from "@/lib/chat-admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("İcazə yoxdur", { status: 401 });

    const { id } = await params;
    const membership = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId: id, userId: session.user.id } },
    });
    if (!membership) return new NextResponse("Qadağandır", { status: 403 });

    const isAdmin = await isChatGroupAdmin(session.user.id, id);
    if (!isAdmin) return new NextResponse("Qadağandır", { status: 403 });

    const body = await req.json().catch(() => ({}));
    const data: { adminsOnly?: boolean; description?: string | null; avatar?: string | null } = {};

    if (typeof body.adminsOnly === "boolean") data.adminsOnly = body.adminsOnly;
    if (typeof body.description === "string" || body.description === null) {
      data.description = body.description;
    }
    if (typeof body.avatar === "string" || body.avatar === null) {
      data.avatar = body.avatar;
    }

    if (Object.keys(data).length === 0) {
      return new NextResponse("Yeniləmək üçün sahə yoxdur", { status: 400 });
    }

    const channel = await prisma.chatChannel.update({
      where: { id },
      data,
    });

    return NextResponse.json(channel);
  } catch (error) {
    console.error("[CHAT_CHANNEL_PATCH]", error);
    return new NextResponse("Server xətası", { status: 500 });
  }
}
