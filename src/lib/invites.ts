import crypto from "crypto";

// =============================================================================
// Invite helpers — token generation & shared constants
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
