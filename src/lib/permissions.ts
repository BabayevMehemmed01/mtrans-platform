import { PermissionKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// =============================================================================
// RBAC Permission Checker — Granular permission system
// =============================================================================

export type { PermissionKey };

/**
 * İstifadəçinin konkret bir icazəyə sahib olub-olmadığını yoxlayır.
 *
 * @param userId - İstifadəçinin ID-si
 * @param permission - Yoxlanılacaq icazə (PermissionKey enum)
 * @returns boolean
 *
 * @example
 * const canCreate = await hasPermission(userId, "CAN_CREATE_PROJECT");
 * if (!canCreate) throw new Error("Forbidden");
 */
export async function hasPermission(
  userId: string,
  permission: PermissionKey
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: {
        select: {
          permissions: {
            select: {
              permission: {
                select: { key: true },
              },
            },
          },
        },
      },
    },
  });

  if (!user?.role) return false;

  return user.role.permissions.some((rp) => rp.permission.key === permission);
}

/**
 * İstifadəçinin birdən çox icazəyə sahib olub-olmadığını yoxlayır.
 * requireAll=true: Bütün icazələr lazımdır (AND)
 * requireAll=false: Ən azı biri yetərlidir (OR)
 */
export async function hasPermissions(
  userId: string,
  permissions: PermissionKey[],
  requireAll = false
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: {
        select: {
          permissions: {
            select: {
              permission: {
                select: { key: true },
              },
            },
          },
        },
      },
    },
  });

  if (!user?.role) return false;

  const userPermissions = new Set(
    user.role.permissions.map((rp) => rp.permission.key)
  );

  if (requireAll) {
    return permissions.every((p) => userPermissions.has(p));
  } else {
    return permissions.some((p) => userPermissions.has(p));
  }
}

/**
 * İstifadəçinin bütün icazələrini Set kimi qaytarır.
 * Tez-tez yoxlamalar üçün cache kimi istifadə olunur.
 */
export async function getUserPermissions(
  userId: string
): Promise<Set<PermissionKey>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: {
        select: {
          permissions: {
            select: {
              permission: {
                select: { key: true },
              },
            },
          },
        },
      },
    },
  });

  if (!user?.role) return new Set();

  return new Set(user.role.permissions.map((rp) => rp.permission.key));
}

/**
 * API route-lar üçün permission guard — xəta atır.
 * NextResponse ilə işləmək üçün istifadə olunur.
 */
export async function requirePermission(
  userId: string,
  permission: PermissionKey
): Promise<void> {
  const allowed = await hasPermission(userId, permission);
  if (!allowed) {
    throw new PermissionError(
      `Bu əməliyyat üçün icazəniz yoxdur: ${permission}`
    );
  }
}

/**
 * İstifadəçinin həmin şirkətə aid olub-olmadığını yoxlayır.
 */
export async function requireSameCompany(
  userId: string,
  targetCompanyId: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (!user?.companyId || user.companyId !== targetCompanyId) {
    throw new PermissionError("Bu şirkətin resurslarına giriş icazəniz yoxdur");
  }
}

const PROJECT_ROLE_RANK: Record<string, number> = {
  VIEWER: 0,
  MEMBER: 1,
  MANAGER: 2,
  OWNER: 3,
};

/**
 * Layihə səviyyəsində giriş yoxlaması.
 * Şirkət daxilindəki qlobal icazə (fallbackPermission) VƏ YA layihənin öz
 * ProjectMember rolu kifayət qədər yüksəkdirsə icazə verilir.
 *
 * @example
 * await requireProjectAccess(userId, projectId, "MANAGER", "CAN_EDIT_PROJECT");
 */
export async function requireProjectAccess(
  userId: string,
  projectId: string,
  minRole: keyof typeof PROJECT_ROLE_RANK,
  fallbackPermission?: PermissionKey
): Promise<void> {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });

  if (member && PROJECT_ROLE_RANK[member.role] >= PROJECT_ROLE_RANK[minRole]) {
    return;
  }

  if (fallbackPermission && (await hasPermission(userId, fallbackPermission))) {
    return;
  }

  throw new PermissionError("Bu layihə üzərində bu əməliyyat üçün icazəniz yoxdur");
}

/**
 * İstifadəçinin bir layihəni görüb-görə bilməyəcəyini yoxlayır
 * (üzv olduğu, YA DA CAN_VIEW_PROJECT şirkət icazəsi olan layihələr görünür).
 */
export async function canViewProject(userId: string, projectId: string): Promise<boolean> {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });
  if (member) return true;
  return hasPermission(userId, "CAN_VIEW_PROJECT");
}

/**
 * Custom permission error class — HTTP 403 üçün
 */
export class PermissionError extends Error {
  readonly statusCode = 403;

  constructor(message: string) {
    super(message);
    this.name = "PermissionError";
  }
}

/**
 * İcazə kateqoriyaları — UI-da qruplamaq üçün
 */
export const PERMISSION_CATEGORIES = [
  "COMPANY",
  "ROLE",
  "DEPARTMENT",
  "PROJECT",
  "TASK",
  "SUBTASK",
  "COMMENT",
  "FILE",
  "REPORT",
] as const;

export type PermissionCategory = (typeof PERMISSION_CATEGORIES)[number];
