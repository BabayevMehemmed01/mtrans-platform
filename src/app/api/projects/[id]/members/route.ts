import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const companyId = (session.user as any).companyId;
    const { id } = await params;
    const { userId, role } = await req.json();

    if (!userId || !role) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    // Verify project belongs to company
    const project = await prisma.project.findFirst({
      where: { id, companyId },
    });

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    // Upsert project member
    const member = await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: id,
          userId,
        },
      },
      update: {
        role,
      },
      create: {
        projectId: id,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          }
        }
      }
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error("[PROJECT_MEMBER_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const companyId = (session.user as any).companyId;
    const { id } = await params;
    const { userId } = await req.json();

    if (!userId) {
      return new NextResponse("User ID required", { status: 400 });
    }

    // Verify project belongs to company
    const project = await prisma.project.findFirst({
      where: { id, companyId },
    });

    if (!project) {
      return new NextResponse("Project not found", { status: 404 });
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId: id,
          userId,
        },
      },
    });

    return new NextResponse("Deleted", { status: 200 });
  } catch (error) {
    console.error("[PROJECT_MEMBER_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
