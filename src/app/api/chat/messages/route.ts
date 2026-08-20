import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canSendInChannel } from "@/lib/chat-admin";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");

    if (!channelId) {
      return new NextResponse("Channel ID required", { status: 400 });
    }

    // Verify user is member of this channel
    const membership = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId: session.user.id } }
    });

    if (!membership) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await prisma.message.updateMany({
      where: {
        channelId,
        isPinned: true,
        pinExpiry: { lt: new Date() },
      },
      data: { isPinned: false, pinExpiry: null },
    });

    const messages = await prisma.message.findMany({
      where: { channelId },
      include: {
        sender: { select: { id: true, name: true, avatar: true } }
      },
      orderBy: { createdAt: "asc" }
    });

    // Update lastReadAt
    await prisma.channelMember.update({
      where: { id: membership.id },
      data: { lastReadAt: new Date() }
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("[CHAT_MESSAGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    
    const body = await req.json();
    const { channelId, content, fileUrl, fileName, fileType } = body;

    if (!channelId) return new NextResponse("channelId required", { status: 400 });
    if (!content && !fileUrl) return new NextResponse("Content or file required", { status: 400 });

    const membership = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId: session.user.id } }
    });

    if (!membership) return new NextResponse("Forbidden", { status: 403 });

    const sendCheck = await canSendInChannel(session.user.id, channelId);
    if (!sendCheck.ok) {
      return new NextResponse(
        sendCheck.status === 404 ? "Channel not found" : "Only group admins can send messages",
        { status: sendCheck.status }
      );
    }

    const message = await prisma.message.create({
      data: {
        content,
        fileUrl,
        fileName,
        fileType,
        channelId,
        senderId: session.user.id
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } }
      }
    });

    // Update channel updatedAt
    await prisma.chatChannel.update({
      where: { id: channelId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("[CHAT_MESSAGES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
