import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { acceptInviteSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

// =============================================================================
// PUBLIC — Dəvəti qəbul etmə axını (istifadəçi hələ sistemə daxil deyil)
// GET  /api/invites/accept/[token] — Dəvətin təhlükəsiz məlumatlarını qaytarır
// POST /api/invites/accept/[token] — Hesab yaradır və dəvəti ACCEPTED edir
// =============================================================================

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        company: { select: { name: true } },
        invitedBy: { select: { name: true } },
        role: { select: { name: true } },
        department: { select: { name: true } },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Dəvət tapılmadı" }, { status: 404 });
    }

    if (invite.status === "ACCEPTED") {
      return NextResponse.json({ error: "Bu dəvət artıq qəbul edilib" }, { status: 410 });
    }
    if (invite.status === "REVOKED") {
      return NextResponse.json({ error: "Bu dəvət ləğv edilib" }, { status: 410 });
    }
    if (invite.status === "EXPIRED" || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Bu dəvətin vaxtı bitib" }, { status: 410 });
    }

    return NextResponse.json({
      email: invite.email,
      type: invite.type,
      companyName: invite.company.name,
      inviterName: invite.invitedBy.name,
      roleName: invite.role?.name ?? null,
      departmentName: invite.department?.name ?? null,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error("[GET /api/invites/accept/[token]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite) {
      return NextResponse.json({ error: "Dəvət tapılmadı" }, { status: 404 });
    }
    if (invite.status === "ACCEPTED") {
      return NextResponse.json({ error: "Bu dəvət artıq qəbul edilib" }, { status: 410 });
    }
    if (invite.status === "REVOKED") {
      return NextResponse.json({ error: "Bu dəvət ləğv edilib" }, { status: 410 });
    }
    if (invite.status === "EXPIRED" || invite.expiresAt < new Date()) {
      // Statusu da sinxronlaşdıraq
      if (invite.status !== "EXPIRED") {
        await prisma.invite.update({ where: { id: invite.id }, data: { status: "EXPIRED" } });
      }
      return NextResponse.json({ error: "Bu dəvətin vaxtı bitib" }, { status: 410 });
    }

    const body = await req.json();
    const parsed = acceptInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const { name, password } = parsed.data;

    // Email artıq istifadə olunubmu? (qlobal unikal sahə)
    const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Bu email ünvanı ilə artıq hesab mövcuddur" },
        { status: 400 }
      );
    }

    let roleId = invite.roleId;
    if (!roleId) {
      const defaultRole = await prisma.role.findFirst({
        where: { companyId: invite.companyId, isDefault: true },
      });
      if (defaultRole) roleId = defaultRole.id;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: invite.email,
          passwordHash,
          status: "ACTIVE",
          companyId: invite.companyId,
          roleId: roleId || null,
          departmentId: invite.departmentId || null,
        },
      });

      if (invite.type === "GUEST" && invite.projectIds.length > 0) {
        for (const projectId of invite.projectIds) {
          try {
            await tx.projectMember.create({
              data: { projectId, userId: user.id, role: "VIEWER" },
            });
          } catch (err) {
            // Layihə silinmiş və ya artıq üzv olduğu üçün yaranan xətaları görməzdən gəlirik
            console.error("[ACCEPT_INVITE] ProjectMember yaratma xətası:", err);
          }
        }
      }

      // MEMBER tipli dəvətlər üçün: şirkətin default layihələrinə avtomatik üzv kimi əlavə edirik
      if (invite.type === "MEMBER") {
        const company = await tx.company.findUnique({
          where: { id: invite.companyId },
          select: { defaultProjectIds: true },
        });

        if (company && company.defaultProjectIds.length > 0) {
          for (const projectId of company.defaultProjectIds) {
            try {
              await tx.projectMember.create({
                data: { projectId, userId: user.id, role: "MEMBER" },
              });
            } catch (err) {
              // Layihə silinmiş və ya artıq üzv olduğu üçün yaranan xətaları görməzdən gəlirik
              console.error("[ACCEPT_INVITE] Default ProjectMember yaratma xətası:", err);
            }
          }
        }
      }

      await tx.invite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });

      return user;
    });

    await logAudit({
      userId: createdUser.id,
      companyId: invite.companyId,
      action: "CREATE",
      entityType: "USER",
      entityId: createdUser.id,
      entityName: createdUser.name,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/invites/accept/[token]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
