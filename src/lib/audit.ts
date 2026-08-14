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
      },
    });
  } catch (error) {
    console.error("[AUDIT_LOG_FAILED]", { action, entityType, entityId }, error);
  }
}
