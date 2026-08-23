import { PermissionKey } from "@prisma/client";
import { NextResponse } from "next/server";
import {
  PermissionError,
  getUserPermissions,
  hasFullAccess,
} from "@/lib/permissions";

export type AppModule = "marketing" | "wms" | "finance" | "crm";
export type ModuleAction = "view" | "manage";

export const MODULE_ROUTE_PREFIXES: { prefix: string; module: AppModule }[] = [
  { prefix: "/dashboard/marketing", module: "marketing" },
  { prefix: "/api/marketing", module: "marketing" },
  { prefix: "/dashboard/inventory", module: "wms" },
  { prefix: "/api/inventory", module: "wms" },
  { prefix: "/dashboard/reports", module: "finance" },
  { prefix: "/dashboard/crm", module: "crm" },
  { prefix: "/api/crm", module: "crm" },
];

const MODULE_KEYS: Record<AppModule, { view: PermissionKey; manage: PermissionKey }> = {
  marketing: { view: "CAN_VIEW_MARKETING", manage: "CAN_MANAGE_MARKETING" },
  wms: { view: "CAN_VIEW_WMS", manage: "CAN_MANAGE_WMS" },
  finance: { view: "CAN_VIEW_FINANCE", manage: "CAN_MANAGE_FINANCE" },
  crm: { view: "CAN_VIEW_CRM", manage: "CAN_MANAGE_CRM" },
};

export function moduleKeysFor(module: AppModule) {
  return MODULE_KEYS[module];
}

export function hasModuleAccessFromKeys(
  permissions: readonly string[] | undefined,
  module: AppModule,
  action: ModuleAction,
  flags?: { isFounder?: boolean; isSuperAdmin?: boolean }
): boolean {
  if (flags?.isFounder || flags?.isSuperAdmin) return true;
  const keys = MODULE_KEYS[module];
  const perms = permissions ?? [];
  if (action === "manage") return perms.includes(keys.manage);
  return perms.includes(keys.view) || perms.includes(keys.manage);
}

export async function canAccessModule(
  userId: string,
  module: AppModule,
  action: ModuleAction = "view"
): Promise<boolean> {
  if (await hasFullAccess(userId)) return true;
  const perms = await getUserPermissions(userId);
  const keys = MODULE_KEYS[module];
  if (action === "manage") return perms.has(keys.manage);
  return perms.has(keys.view) || perms.has(keys.manage);
}

export async function requireModuleAccess(
  userId: string,
  module: AppModule,
  action: ModuleAction = "view"
): Promise<void> {
  if (await canAccessModule(userId, module, action)) return;
  throw new PermissionError(
    action === "manage"
      ? "Bu modulda dəyişiklik etmək üçün icazəniz yoxdur"
      : "Bu modulə giriş icazəniz yoxdur (Access Denied)"
  );
}

export function moduleDeniedJson(message = "Access Denied") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function isMutationMethod(method: string) {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}
