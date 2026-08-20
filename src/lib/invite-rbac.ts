// Client-safe helpers — Super Admin / Founder vs Manager (şöbə rəhbəri)

export function normalizeInviteRoleName(name: string): string {
  return name.trim().toLowerCase();
}

/** Super Admin və Founder — istənilən şöbəyə və istənilən rola dəvət edə bilər */
export function isPrivilegedInviteRoleName(name?: string | null): boolean {
  if (!name) return false;
  const n = normalizeInviteRoleName(name);
  return n === "super admin" || n === "founder";
}

/** Manager sistemi rolu (şöbə rəhbəri səviyyəsi) */
export function isManagerInviteRoleName(name?: string | null): boolean {
  if (!name) return false;
  return normalizeInviteRoleName(name) === "manager";
}
