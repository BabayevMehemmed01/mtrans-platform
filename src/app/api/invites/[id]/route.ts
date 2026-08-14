import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { generateInviteToken, getInviteExpiryDate } from "@/lib/invites";
import { sendInviteEmail } from "@/lib/resend";

// =============================================================================
// PATCH /api/invites/[id] — Dəvəti yenidən göndər (token + müddət yenilənir)
// DELETE /api/invites/[id] — Dəvəti ləğv et (REVOKED)
// =============================================================================

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    await requirePermission(session.user.id, "CAN_INVITE_USER");

    const { id } = await params;

    const invite = await prisma.invite.findFirst({ where: { id, companyId } });
    if (!invite) return NextResponse.json({ error: "Dəvət tapılmadı" }, { status: 404 });

    if (invite.status !== "PENDING" && invite.status !== "EXPIRED") {
      return NextResponse.json(
        { error: "Yalnız gözləmədə olan və ya vaxtı bitmiş dəvətlər yenidən göndərilə bilər" },
        { status: 400 }
      );
    }

    const updated = await prisma.invite.update({
      where: { id },
      data: {
        token: generateInviteToken(),
        expiresAt: getInviteExpiryDate(),
        status: "PENDING",
      },
      include: {
        invitedBy: { select: { id: true, name: true, avatar: true } },
        role: { select: { id: true, name: true, color: true } },
        department: { select: { id: true, name: true, color: true } },
      },
    });

    const inviterName = session.user.name || "Bir komanda üzvü";
    const companyName = (session.user as any).company?.name || "şirkət";

    await sendInviteEmail({
      to: updated.email,
      inviterName,
      companyName,
      token: updated.token,
      type: updated.type,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[PATCH /api/invites/[id]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    await requirePermission(session.user.id, "CAN_INVITE_USER");

    const { id } = await params;

    const invite = await prisma.invite.findFirst({ where: { id, companyId } });
    if (!invite) return NextResponse.json({ error: "Dəvət tapılmadı" }, { status: 404 });

    await prisma.invite.update({
      where: { id },
      data: { status: "REVOKED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[DELETE /api/invites/[id]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
