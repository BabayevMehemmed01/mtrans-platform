import { prisma } from "@/lib/prisma";
import type { AuditAction, EntityType, Prisma } from "@prisma/client";

// =============================================================================
// Audit Log Helper — "kim, nə vaxt, nə etdi" jurnalı
// Bu funksiya heç vaxt əsas əməliyyatı pozmamalıdır: xəta zamanı sadəcə
// console.error edir, throw etmir.
// =============================================================================

interface LogAuditParams {
  userId: string;
  companyId: string;
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  entityName?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  sessionDurationMs?: number | null;
}

export async function getRequestMeta(): Promise<{
  ipAddress: string | null;
  userAgent: string | null;
}> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    const ipAddress =
      forwarded?.split(",")[0]?.trim() ||
      h.get("x-real-ip") ||
      h.get("cf-connecting-ip") ||
      null;
    return { ipAddress, userAgent: h.get("user-agent") };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}

export async function logAudit({
  userId,
  companyId,
  action,
  entityType,
  entityId,
  entityName,
  metadata,
  ipAddress,
  userAgent,
  sessionDurationMs,
}: LogAuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        companyId,
        action,
        entityType,
        entityId,
        entityName: entityName ?? null,
        metadata: metadata ?? undefined,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        sessionDurationMs: sessionDurationMs ?? null,
      },
    });
  } catch (error) {
    console.error("[AUDIT_LOG_FAILED]", { action, entityType, entityId }, error);
  }
}

export async function logUserLogin(params: {
  userId: string;
  companyId: string;
  userName?: string | null;
}): Promise<void> {
  const meta = await getRequestMeta();
  await logAudit({
    userId: params.userId,
    companyId: params.companyId,
    action: "LOGIN",
    entityType: "USER",
    entityId: params.userId,
    entityName: params.userName ?? null,
    ...meta,
  });
}

export async function logUserLogout(params: {
  userId: string;
  companyId: string;
  userName?: string | null;
  sessionStartedAt?: number | null;
}): Promise<void> {
  const meta = await getRequestMeta();
  let sessionDurationMs: number | null = null;

  if (params.sessionStartedAt && Number.isFinite(params.sessionStartedAt)) {
    sessionDurationMs = Math.max(0, Date.now() - params.sessionStartedAt);
  } else {
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { lastLoginAt: true },
    });
    if (user?.lastLoginAt) {
      sessionDurationMs = Math.max(0, Date.now() - user.lastLoginAt.getTime());
    }
  }

  await logAudit({
    userId: params.userId,
    companyId: params.companyId,
    action: "LOGOUT",
    entityType: "USER",
    entityId: params.userId,
    entityName: params.userName ?? null,
    sessionDurationMs,
    metadata: sessionDurationMs != null ? { sessionDurationMs } : undefined,
    ...meta,
  });
}
