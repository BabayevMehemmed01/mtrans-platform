import { NextRequest, NextResponse } from "next/server";
import { verifyInvitationToken } from "@/lib/invites";

// =============================================================================
// PUBLIC — GET /api/invites/verify?token=...
// Qeydiyyat səhifəsi dəvətin kimə aid olduğunu yoxlayır.
// =============================================================================

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")?.trim();
    if (!token) {
      return NextResponse.json({ error: "Token tələb olunur" }, { status: 400 });
    }

    const result = await verifyInvitationToken(token);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.invitation);
  } catch (error) {
    console.error("[GET /api/invites/verify]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
