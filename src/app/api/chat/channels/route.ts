import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    
    const userId = session.user.id;
    const companyId = (session.user as any).companyId;

    if (!companyId) return new NextResponse("Company Required", { status: 400 });

    // Ensure user has their project/department groups
    // In a real system, you'd trigger this on project/department creation, 
    // but here we can sync channels for demo purposes.
    const projects = await prisma.project.findMany({
      where: { members: { some: { userId } } }
    });

    for (const project of projects) {
      // Find or create project channel
      let channel = await prisma.chatChannel.findFirst({
        where: { projectId: project.id, type: "PROJECT" }
      });
      if (!channel) {
        channel = await prisma.chatChannel.create({
          data: {
            name: project.name,
            type: "PROJECT",
            companyId,
            projectId: project.id
          }
        });
      }
      // ensure user is in it
      const isMember = await prisma.channelMember.findUnique({
        where: { channelId_userId: { channelId: channel.id, userId } }
      });
      if (!isMember) {
        await prisma.channelMember.create({
          data: { channelId: channel.id, userId }
        });
      }
    }

    const myDepartments = await prisma.department.findMany({
      where: { users: { some: { id: userId } } }
    });

    for (const dept of myDepartments) {
      let channel = await prisma.chatChannel.findFirst({
        where: { departmentId: dept.id, type: "DEPARTMENT" }
      });
      if (!channel) {
        channel = await prisma.chatChannel.create({
          data: {
            name: dept.name,
            type: "DEPARTMENT",
            companyId,
            departmentId: dept.id
          }
        });
      }
      const isMember = await prisma.channelMember.findUnique({
        where: { channelId_userId: { channelId: channel.id, userId } }
      });
      if (!isMember) {
        await prisma.channelMember.create({
          data: { channelId: channel.id, userId }
        });
      }
    }

    // Now fetch all channels where user is a member
    const channels = await prisma.chatChannel.findMany({
      where: {
        companyId,
        members: { some: { userId } }
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatar: true } } } }
      },
      orderBy: { updatedAt: "desc" }
    });

    // Also get all company users for direct message creation support
    const companyUsers = await prisma.user.findMany({
      where: { companyId, id: { not: userId } },
      select: { id: true, name: true, avatar: true, email: true }
    });

    return NextResponse.json({ channels, companyUsers });
  } catch (error) {
    console.error("[CHAT_CHANNELS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
    
    const userId = session.user.id;
    const companyId = (session.user as any).companyId;

    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return new NextResponse("targetUserId required", { status: 400 });
    }

    // Check if direct channel already exists
    const existing = await prisma.chatChannel.findFirst({
      where: {
        type: "DIRECT",
        companyId,
        members: {
          every: {
            userId: { in: [userId, targetUserId] }
          }
        }
      }
    });

    if (existing) {
      // Must exactly match these two
      const memberCount = await prisma.channelMember.count({ where: { channelId: existing.id } });
      if (memberCount === 2) {
        return NextResponse.json(existing);
      }
    }

    // Create new direct channel
    const channel = await prisma.chatChannel.create({
      data: {
        type: "DIRECT",
        companyId,
        members: {
          create: [
            { userId },
            { userId: targetUserId }
          ]
        }
      }
    });

    return NextResponse.json(channel);
  } catch (error) {
    console.error("[CHAT_CHANNELS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
