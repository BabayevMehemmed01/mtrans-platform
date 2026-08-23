import { PermissionKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isManagerInviteRoleName, isPrivilegedInviteRoleName } from "@/lib/invite-rbac";

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
  const permissions = await getUserPermissions(userId);
  return permissions.has(permission);
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
  const userPermissions = await getUserPermissions(userId);

  if (requireAll) {
    return permissions.every((p) => userPermissions.has(p));
  } else {
    return permissions.some((p) => userPermissions.has(p));
  }
}

/**
 * İstifadəçinin bütün icazələrini Set kimi qaytarır — rolundan gələn icazələr
 * VƏ şöbə rəhbəri tərəfindən fərdi verilmiş əlavə icazələr (UserPermission)
 * birləşdirilir. Additiv sistemdir: fərdi icazə rolu əvəz etmir, üstünə gəlir.
 * Tez-tez yoxlamalar üçün cache kimi istifadə olunur.
 */
export async function getUserPermissions(
  userId: string
): Promise<Set<PermissionKey>> {
  if (await hasFullAccess(userId)) {
    return new Set(Object.values(PermissionKey) as PermissionKey[]);
  }

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
      extraPermissions: {
        select: {
          permission: {
            select: { key: true },
          },
        },
      },
    },
  });

  if (!user) return new Set();

  const permissions = new Set<PermissionKey>();
  for (const rp of user.role?.permissions ?? []) permissions.add(rp.permission.key);
  for (const up of user.extraPermissions) permissions.add(up.permission.key);

  return permissions;
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
 * Təsisçi: isFounder bayrağı, şirkət sahibi və ya Founder sistemi rolu.
 * Super Admin Təsisçini silə və ya yetkisini ala bilməz.
 */
export async function isFounder(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isFounder: true,
      role: { select: { name: true } },
      company: { select: { ownerId: true } },
    },
  });
  if (!user) return false;
  if (user.isFounder) return true;
  if (user.company?.ownerId === userId) return true;
  return (user.role?.name ?? "").trim().toLowerCase() === "founder";
}

/**
 * FOUNDER və SUPER_ADMIN — modul səviyyəsində tam giriş.
 * hasPermission-a müraciət etmir (rekursiyanın qarşısı).
 */
export async function hasFullAccess(userId: string): Promise<boolean> {
  if (await isFounder(userId)) return true;
  return isSuperAdmin(userId);
}

/**
 * Super Admin Təsisçinin hesabını silə, rolunu/statusunu dəyişə
 * və ya icazələrini geri ala bilməz.
 */
export async function assertCanMutatePrincipal(
  actorId: string,
  targetId: string,
  kind: "delete" | "privilege" = "privilege"
): Promise<void> {
  if (actorId === targetId && kind !== "delete") return;
  if (!(await isFounder(targetId))) return;
  if (await isFounder(actorId)) return;
  throw new PermissionError(
    kind === "delete"
      ? "Təsisçinin (Müşahidə Şurasının sədri) hesabını silmək mümkün deyil"
      : "Təsisçinin yetkisini almaq və ya məlumatlarını dəyişmək mümkün deyil"
  );
}

/**
 * İstifadəçinin şirkətin Super Admin-i olub-olmadığını yoxlayır.
 * Təsisçi, Super Admin rolu və ya CAN_MANAGE_COMPANY icazəsi.
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isFounder: true,
      company: { select: { ownerId: true } },
      role: {
        select: {
          name: true,
          permissions: { select: { permission: { select: { key: true } } } },
        },
      },
    },
  });
  if (!user) return false;
  if (user.company?.ownerId === userId || user.isFounder) return true;
  const roleName = (user.role?.name ?? "").trim().toLowerCase();
  if (roleName === "super admin") return true;
  return (user.role?.permissions ?? []).some((rp) => rp.permission.key === "CAN_MANAGE_COMPANY");
}

/**
 * İstifadəçinin konkret şöbənin rəhbəri olub-olmadığını yoxlayır.
 */
export async function isDepartmentHead(
  userId: string,
  departmentId: string
): Promise<boolean> {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { headUserId: true },
  });
  return !!department && department.headUserId === userId;
}

export type InviteAuthority = {
  isPrivileged: boolean;
  isDepartmentScoped: boolean;
  allowedDepartmentIds: string[];
  lockedDepartmentId: string | null;
};

/**
 * Dəvət göndərənin səlahiyyəti: Super Admin / Founder hər şöbə və rola
 * dəvət edə bilər; Manager / şöbə rəhbəri yalnız öz şöbəsinə və alt rollara.
 */
export async function getInviteAuthority(userId: string): Promise<InviteAuthority> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      departmentId: true,
      role: { select: { name: true } },
      headOfDepartments: { select: { id: true } },
    },
  });

  const roleName = user?.role?.name ?? null;
  const isPrivileged =
    (await isSuperAdmin(userId)) || isPrivilegedInviteRoleName(roleName);
  const headedIds = user?.headOfDepartments.map((d) => d.id) ?? [];
  const isDepartmentScoped =
    !isPrivileged && (isManagerInviteRoleName(roleName) || headedIds.length > 0);

  const allowedDepartmentIds = isPrivileged
    ? []
    : headedIds.length > 0
      ? headedIds
      : user?.departmentId
        ? [user.departmentId]
        : [];

  return {
    isPrivileged,
    isDepartmentScoped,
    allowedDepartmentIds,
    lockedDepartmentId: isDepartmentScoped ? (allowedDepartmentIds[0] ?? null) : null,
  };
}

/**
 * Postman bypass-ə qarşı: Manager Super Admin/Founder dəvət edə bilməz
 * və yalnız öz şöbəsinə dəvət göndərə bilər.
 */
export function assertInviteTargetsAllowed(
  authority: InviteAuthority,
  departmentId: string | null | undefined,
  roleName: string | null | undefined
): void {
  if (authority.isPrivileged) return;

  if (isPrivilegedInviteRoleName(roleName)) {
    throw new PermissionError(
      "Super Admin və ya Founder roluna yalnız Super Admin və Founder dəvət göndərə bilər"
    );
  }

  if (authority.isDepartmentScoped) {
    if (!departmentId || !authority.allowedDepartmentIds.includes(departmentId)) {
      throw new PermissionError("Yalnız öz şöbənizə dəvət göndərə bilərsiniz");
    }
  }
}

/**
 * Şöbə səviyyəsində idarəetmə girişi: Super Admin, VƏ YA həmin şöbənin
 * rəhbəri, VƏ YA qlobal fallback icazəsi olan istifadəçi keçir.
 */
export async function requireDepartmentManage(
  userId: string,
  departmentId: string,
  fallbackPermission?: PermissionKey
): Promise<void> {
  if (await isSuperAdmin(userId)) return;
  if (await isDepartmentHead(userId, departmentId)) return;
  if (fallbackPermission && (await hasPermission(userId, fallbackPermission))) return;
  throw new PermissionError("Bu şöbə üzərində bu əməliyyat üçün icazəniz yoxdur");
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
  "MARKETING",
  "FINANCE",
  "WMS",
  "CRM",
  "HR",
  "LEGAL",
  "IT",
  "DATA",
  "LOGISTICS",
  "INTERNATIONAL",
] as const;

export type PermissionCategory = (typeof PERMISSION_CATEGORIES)[number];
