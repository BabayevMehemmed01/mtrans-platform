import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/permissions";

// =============================================================================
// GET /api/departments/[id]/channel
// Şöbənin qrup söhbət kanalını tapır (yoxdursa yaradır) və tələb edəni üzv
// kimi əlavə edir. Mesajlar üçün /api/chat/messages?channelId=... istifadə
// olunur (artıq üzvlük yoxlaması ilə ümumi kanal API-si).
// =============================================================================

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("İcazə yoxdur", { status: 401 });

    const { id: departmentId } = await params;
    const userId = session.user.id;
    const companyId = (session.user as any).companyId;

    const department = await prisma.department.findFirst({
      where: { id: departmentId, companyId },
    });
    if (!department) return new NextResponse("Şöbə tapılmadı", { status: 404 });

    // Yalnız bu şöbənin üzvləri, rəhbəri, VƏ YA Super Admin qrup söhbətinə qoşula bilər
    const isMemberOfDept = await prisma.user.findFirst({
      where: { id: userId, departmentId },
    });
    if (!isMemberOfDept && department.headUserId !== userId && !(await isSuperAdmin(userId))) {
      return new NextResponse("Qadağandır", { status: 403 });
    }

    let channel = await prisma.chatChannel.findFirst({
      where: { departmentId, type: "DEPARTMENT" },
    });
    if (!channel) {
      channel = await prisma.chatChannel.create({
        data: {
          name: department.name,
          type: "DEPARTMENT",
          companyId,
          departmentId,
        },
      });
    }

    const membership = await prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId: channel.id, userId } },
    });
    if (!membership) {
      await prisma.channelMember.create({ data: { channelId: channel.id, userId } });
    }

    const fullChannel = await prisma.chatChannel.findUnique({
      where: { id: channel.id },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      },
    });

    return NextResponse.json(fullChannel);
  } catch (error) {
    console.error("[DEPARTMENT_CHANNEL_GET]", error);
    return new NextResponse("Server xətası", { status: 500 });
  }
}
