import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createInviteSchema } from "@/lib/validations";
import {
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
  deleteStaleInvites,
  invitationListInclude,
} from "@/lib/invites";
import { sendInviteEmail } from "@/lib/mailer";
import { logAudit } from "@/lib/audit";

// =============================================================================
// GET /api/invites — Şirkətin dəvətlərini qaytar (?status=PENDING dəstəklənir)
// POST /api/invites — Yeni dəvət yarat (MEMBER | GUEST) və email göndər
// =============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const companyId = (session.user as { companyId?: string }).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    await deleteStaleInvites(companyId);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const invites = await prisma.invitation.findMany({
      where: {
        companyId,
        ...(status ? { status: status as "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED" } : {}),
      },
      include: invitationListInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invites);
  } catch (error) {
    console.error("[GET /api/invites]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const companyId = (session.user as { companyId?: string }).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    const body = await req.json();
    const parsed = createInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }

    const { type, roleId, departmentId, projectIds, name, surname, message } = parsed.data;
    const email = parsed.data.email.toLowerCase().trim();

    const authority = await getInviteAuthority(session.user.id);

    // Dəvət göndərmək üçün ya Super Admin/Founder, ya qlobal CAN_INVITE_USER,
    // ya da bu dəvətin hədəf aldığı şöbənin rəhbəri olmaq lazımdır.
    const canInvite =
      authority.isPrivileged ||
      (await hasPermission(session.user.id, "CAN_INVITE_USER")) ||
      (!!departmentId && (await isDepartmentHead(session.user.id, departmentId)));
    if (!canInvite) {
      throw new PermissionError("Dəvət göndərmək üçün icazəniz yoxdur");
    }

    const existingUser = await prisma.user.findFirst({
      where: { email, companyId },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Bu email ünvanı ilə artıq şirkətdə istifadəçi mövcuddur" },
        { status: 400 }
      );
    }

    let assignedRoleName: string | null = null;
    if (roleId) {
      const role = await prisma.role.findFirst({ where: { id: roleId, companyId } });
      if (!role) return NextResponse.json({ error: "Rol tapılmadı" }, { status: 400 });
      assignedRoleName = role.name;
    }
    if (departmentId) {
      const department = await prisma.department.findFirst({ where: { id: departmentId, companyId } });
      if (!department) return NextResponse.json({ error: "Şöbə tapılmadı" }, { status: 400 });
    }

    assertInviteTargetsAllowed(authority, departmentId, assignedRoleName);

    let validProjectIds: string[] = [];
    if (type === "GUEST" && projectIds && projectIds.length > 0) {
      const projects = await prisma.project.findMany({
        where: { id: { in: projectIds }, companyId },
        select: { id: true },
      });
      validProjectIds = projects.map((p) => p.id);
    }

    const token = generateInviteToken();
    const now = new Date();
    const inviteData = {
      email,
      name: name.trim(),
      surname: surname.trim(),
      message: message?.trim() || null,
      token,
      type,
      status: "PENDING" as const,
      expiresAt: getInviteExpiryDate(),
      createdAt: now,
      projectIds: type === "GUEST" ? validProjectIds : [],
      companyId,
      roleId: roleId || null,
      departmentId: departmentId || null,
      invitedById: session.user.id,
    };

    const existingPending = await prisma.invitation.findFirst({
      where: { email, companyId, status: "PENDING" },
    });
    const existingExpired = existingPending
      ? null
      : await prisma.invitation.findFirst({
          where: { email, companyId, status: "EXPIRED" },
        });
    const existingInvite = existingPending ?? existingExpired;

    const invite = existingInvite
      ? await prisma.invitation.update({
          where: { id: existingInvite.id },
          data: inviteData,
          include: invitationListInclude,
        })
      : await prisma.invitation.create({
          data: inviteData,
          include: invitationListInclude,
        });

    const inviterName = session.user.name || "Bir komanda üzvü";
    const companyName =
      (session.user as { company?: { name?: string } }).company?.name || "şirkət";

    try {
      await sendInviteEmail({
        to: email,
        recipientName: invitationFullName(invite.name, invite.surname),
        inviterName,
        companyName,
        token: invite.token,
        type: invite.type,
        message: invite.message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "E-poçt göndərilmədi";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "INVITE",
      entityType: "USER",
      entityId: invite.id,
      entityName: invite.email,
    });

    return NextResponse.json(invite, { status: existingInvite ? 200 : 201 });
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[POST /api/invites]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
