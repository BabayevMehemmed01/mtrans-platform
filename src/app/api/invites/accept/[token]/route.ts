import { NextRequest, NextResponse } from "next/server";
import { acceptInviteSchema } from "@/lib/validations";
import { acceptInvitationWithPassword, verifyInvitationToken } from "@/lib/invites";

// =============================================================================
// PUBLIC — Dəvəti qəbul etmə axını (istifadəçi hələ sistemə daxil deyil)
// GET  /api/invites/accept/[token] — Dəvətin təhlükəsiz məlumatlarını qaytarır
// POST /api/invites/accept/[token] — Hesab yaradır və dəvəti ACCEPTED edir
// =============================================================================

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const result = await verifyInvitationToken(token);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result.invitation);
  } catch (error) {
    console.error("[GET /api/invites/accept/[token]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const body = await req.json();
    const parsed = acceptInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }

    const result = await acceptInvitationWithPassword(token, parsed.data.password);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/invites/accept/[token]]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
