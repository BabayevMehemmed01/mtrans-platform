import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updatePreferenceSchema } from "@/lib/validations";

// =============================================================================
// GET   /api/settings/preferences — İstifadəçinin bütün kustomizasiya tərcihləri
// PATCH /api/settings/preferences — Bir "scope" daxilində tək bir elementin
//                                    görünürlüyünü dəyişir (merge, tam əvəz etmir)
// Format: preferences = { "<scope>": { "<itemKey>": true|false, ... }, ... }
// =============================================================================

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { preferences: true },
    });

    return NextResponse.json(user?.preferences ?? {});
  } catch (error) {
    console.error("[GET /api/settings/preferences]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const body = await req.json();
    const parsed = updatePreferenceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const { scope, key, value } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { preferences: true },
    });

    const current = (user?.preferences ?? {}) as Record<string, Record<string, boolean>>;
    const nextPreferences: Record<string, Record<string, boolean>> = {
      ...current,
      [scope]: {
        ...(current[scope] ?? {}),
        [key]: value,
      },
    };

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { preferences: nextPreferences },
      select: { preferences: true },
    });

    return NextResponse.json(updated.preferences);
  } catch (error) {
    console.error("[PATCH /api/settings/preferences]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
