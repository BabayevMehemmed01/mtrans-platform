import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

// =============================================================================
// Invite helpers — token generation, verification & acceptance
// =============================================================================

/** Dəvət linkinin etibarlılıq müddəti (millisaniyə) */
export const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 gün

/** Kriptoqrafik cəhətdən təhlükəsiz, URL-safe dəvət token-i yaradır */
export function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/** Yeni dəvətin bitmə tarixini hesablayır (indiki vaxtdan 7 gün sonra) */
export function getInviteExpiryDate(): Date {
  return new Date(Date.now() + INVITE_EXPIRY_MS);
}

/** PENDING və ləğv edilmiş (REVOKED) dəvətlərin avtomatik silinmə müddəti */
export const STALE_INVITE_MS = 24 * 60 * 60 * 1000;

export const invitationListInclude = {
  invitedBy: { select: { id: true, name: true, avatar: true } },
  role: { select: { id: true, name: true, color: true } },
  department: { select: { id: true, name: true, color: true } },
} as const;

/**
 * Yaranma tarixindən 24 saat keçmiş PENDING və REVOKED dəvətləri silir.
 * (UI-dakı "Ləğv edilib" statusu sxemada REVOKED-dir.)
 */
export async function deleteStaleInvites(companyId: string): Promise<number> {
  const cutoff = new Date(Date.now() - STALE_INVITE_MS);
  const result = await prisma.invitation.deleteMany({
    where: {
      companyId,
      status: { in: ["PENDING", "REVOKED"] },
      createdAt: { lt: cutoff },
    },
  });
  return result.count;
}

export function invitationFullName(name?: string | null, surname?: string | null): string {
  return [name, surname].filter(Boolean).join(" ").trim();
}

const invitationPublicInclude = {
  company: { select: { name: true } },
  invitedBy: { select: { name: true } },
  role: { select: { id: true, name: true } },
  department: { select: { id: true, name: true } },
} as const;

export type InvitationVerifyError = {
  ok: false;
  error: string;
  status: number;
};

export type InvitationVerifySuccess = {
  ok: true;
  invitation: {
    email: string;
    name: string;
    surname: string;
    type: "MEMBER" | "GUEST";
    companyName: string;
    inviterName: string;
    roleName: string | null;
    departmentName: string | null;
    expiresAt: Date;
  };
};

export async function verifyInvitationToken(
  token: string
): Promise<InvitationVerifySuccess | InvitationVerifyError> {
  const invite = await prisma.invitation.findUnique({
    where: { token },
    include: invitationPublicInclude,
  });

  if (!invite) {
    return { ok: false, error: "Dəvət tapılmadı", status: 404 };
  }
  if (invite.status === "ACCEPTED") {
    return { ok: false, error: "Bu dəvət artıq qəbul edilib", status: 410 };
  }
  if (invite.status === "REVOKED") {
    return { ok: false, error: "Bu dəvət ləğv edilib", status: 410 };
  }
  if (invite.status === "EXPIRED" || invite.expiresAt < new Date()) {
    if (invite.status !== "EXPIRED") {
      await prisma.invitation.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });
    }
    return { ok: false, error: "Bu dəvətin vaxtı bitib", status: 410 };
  }

  return {
    ok: true,
    invitation: {
      email: invite.email,
      name: invite.name ?? "",
      surname: invite.surname ?? "",
      type: invite.type,
      companyName: invite.company.name,
      inviterName: invite.invitedBy.name,
      roleName: invite.role?.name ?? null,
      departmentName: invite.department?.name ?? null,
      expiresAt: invite.expiresAt,
    },
  };
}

export type AcceptInvitationResult =
  | { ok: true; userId: string; companyId: string }
  | InvitationVerifyError;

/** Dəvəti qəbul edir, User yaradır və statusu ACCEPTED edir. */
export async function acceptInvitationWithPassword(
  token: string,
  password: string
): Promise<AcceptInvitationResult> {
  const invite = await prisma.invitation.findUnique({ where: { token } });
  if (!invite) {
    return { ok: false, error: "Dəvət tapılmadı", status: 404 };
  }
  if (invite.status === "ACCEPTED") {
    return { ok: false, error: "Bu dəvət artıq qəbul edilib", status: 410 };
  }
  if (invite.status === "REVOKED") {
    return { ok: false, error: "Bu dəvət ləğv edilib", status: 410 };
  }
  if (invite.status === "EXPIRED" || invite.expiresAt < new Date()) {
    if (invite.status !== "EXPIRED") {
      await prisma.invitation.update({
        where: { id: invite.id },
        data: { status: "EXPIRED" },
      });
    }
    return { ok: false, error: "Bu dəvətin vaxtı bitib", status: 410 };
  }

  const existingUser = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existingUser) {
    return {
      ok: false,
      error: "Bu email ünvanı ilə artıq hesab mövcuddur",
      status: 400,
    };
  }

  let roleId = invite.roleId;
  if (!roleId) {
    const defaultRole = await prisma.role.findFirst({
      where: { companyId: invite.companyId, isDefault: true },
    });
    if (defaultRole) roleId = defaultRole.id;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const fullName =
    invitationFullName(invite.name, invite.surname) || invite.email.split("@")[0];

  const createdUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: fullName,
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
          console.error("[ACCEPT_INVITE] ProjectMember yaratma xətası:", err);
        }
      }
    }

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
            console.error("[ACCEPT_INVITE] Default ProjectMember yaratma xətası:", err);
          }
        }
      }
    }

    await tx.invitation.update({
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

  return { ok: true, userId: createdUser.id, companyId: invite.companyId };
}
