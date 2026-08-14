import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createInviteSchema } from "@/lib/validations";
import { hasPermission, isDepartmentHead, PermissionError } from "@/lib/permissions";
import { generateInviteToken, getInviteExpiryDate } from "@/lib/invites";
import { sendInviteEmail } from "@/lib/resend";
import { logAudit } from "@/lib/audit";

// =============================================================================
// GET /api/invites — Şirkətin dəvətlərini qaytar (?status=PENDING dəstəklənir)
// POST /api/invites — Yeni dəvət yarat (MEMBER | GUEST) və email göndər
// =============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const invites = await prisma.invite.findMany({
      where: {
        companyId,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        invitedBy: { select: { id: true, name: true, avatar: true } },
        role: { select: { id: true, name: true, color: true } },
        department: { select: { id: true, name: true, color: true } },
      },
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

    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    const body = await req.json();
    const parsed = createInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }

    const { type, roleId, departmentId, projectIds } = parsed.data;
    const email = parsed.data.email.toLowerCase().trim();

    // Dəvət göndərmək üçün ya qlobal CAN_INVITE_USER icazəsi, ya da bu
    // dəvətin hədəf aldığı şöbənin rəhbəri olmaq lazımdır.
    const canInvite =
      (await hasPermission(session.user.id, "CAN_INVITE_USER")) ||
      (!!departmentId && (await isDepartmentHead(session.user.id, departmentId)));
    if (!canInvite) {
      throw new PermissionError("Dəvət göndərmək üçün icazəniz yoxdur");
    }

    // Artıq aktiv istifadəçi varmı? (bu şirkət daxilində)
    const existingUser = await prisma.user.findFirst({
      where: { email, companyId },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Bu email ünvanı ilə artıq şirkətdə istifadəçi mövcuddur" },
        { status: 400 }
      );
    }

    // Artıq gözləmədə olan dəvət varmı?
    const existingInvite = await prisma.invite.findFirst({
      where: { email, companyId, status: "PENDING" },
    });
    if (existingInvite) {
      return NextResponse.json(
        { error: "Bu email ünvanına artıq gözləmədə olan bir dəvət göndərilib" },
        { status: 400 }
      );
    }

    // Rol/şöbə bu şirkətə aiddirmi — cross-tenant sızmanın qarşısını al
    if (roleId) {
      const role = await prisma.role.findFirst({ where: { id: roleId, companyId } });
      if (!role) return NextResponse.json({ error: "Rol tapılmadı" }, { status: 400 });
    }
    if (departmentId) {
      const department = await prisma.department.findFirst({ where: { id: departmentId, companyId } });
      if (!department) return NextResponse.json({ error: "Şöbə tapılmadı" }, { status: 400 });
    }

    let validProjectIds: string[] = [];
    if (type === "GUEST" && projectIds && projectIds.length > 0) {
      const projects = await prisma.project.findMany({
        where: { id: { in: projectIds }, companyId },
        select: { id: true },
      });
      validProjectIds = projects.map((p) => p.id);
    }

    const invite = await prisma.invite.create({
      data: {
        email,
        token: generateInviteToken(),
        type,
        expiresAt: getInviteExpiryDate(),
        projectIds: type === "GUEST" ? validProjectIds : [],
        companyId,
        roleId: roleId || null,
        departmentId: departmentId || null,
        invitedById: session.user.id,
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
      to: email,
      inviterName,
      companyName,
      token: invite.token,
      type: invite.type,
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "INVITE",
      entityType: "USER",
      entityId: invite.id,
      entityName: invite.email,
    });

    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[POST /api/invites]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
