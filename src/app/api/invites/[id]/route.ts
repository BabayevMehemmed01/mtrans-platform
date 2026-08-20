import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  requirePermission,
  hasPermission,
  isDepartmentHead,
  PermissionError,
  getInviteAuthority,
  assertInviteTargetsAllowed,
} from "@/lib/permissions";
import {
  generateInviteToken,
  getInviteExpiryDate,
  invitationFullName,
  invitationListInclude,
} from "@/lib/invites";
import { sendInviteEmail } from "@/lib/mailer";

// =============================================================================
// PATCH /api/invites/[id] — Dəvəti yenidən göndər (token + müddət yenilənir)
// DELETE /api/invites/[id] — Dəvəti ləğv et (REVOKED)
// =============================================================================

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const companyId = (session.user as { companyId?: string }).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    const authority = await getInviteAuthority(session.user.id);
    const { id } = await params;

    const invite = await prisma.invitation.findFirst({
      where: { id, companyId },
      include: { role: { select: { name: true } } },
    });
    if (!invite) return NextResponse.json({ error: "Dəvət tapılmadı" }, { status: 404 });

    const canResend =
      authority.isPrivileged ||
      (await hasPermission(session.user.id, "CAN_INVITE_USER")) ||
      (!!invite.departmentId && (await isDepartmentHead(session.user.id, invite.departmentId)));
    if (!canResend) {
      throw new PermissionError("Dəvəti yenidən göndərmək üçün icazəniz yoxdur");
    }

    assertInviteTargetsAllowed(authority, invite.departmentId, invite.role?.name);

    if (invite.status !== "PENDING" && invite.status !== "EXPIRED") {
      return NextResponse.json(
        { error: "Yalnız gözləmədə olan və ya vaxtı bitmiş dəvətlər yenidən göndərilə bilər" },
        { status: 400 }
      );
    }

    const now = new Date();
    const updated = await prisma.invitation.update({
      where: { id },
      data: {
        token: generateInviteToken(),
        createdAt: now,
        expiresAt: getInviteExpiryDate(),
        status: "PENDING",
      },
      include: invitationListInclude,
    });

    const inviterName = session.user.name || "Bir komanda üzvü";
    const companyName =
      (session.user as { company?: { name?: string } }).company?.name || "şirkət";

    await sendInviteEmail({
      to: updated.email,
      recipientName: invitationFullName(updated.name, updated.surname),
      inviterName,
      companyName,
      token: updated.token,
      type: updated.type,
      message: updated.message,
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const companyId = (session.user as { companyId?: string }).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    await requirePermission(session.user.id, "CAN_INVITE_USER");

    const { id } = await params;

    const invite = await prisma.invitation.findFirst({ where: { id, companyId } });
    if (!invite) return NextResponse.json({ error: "Dəvət tapılmadı" }, { status: 404 });

    await prisma.invitation.update({
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
