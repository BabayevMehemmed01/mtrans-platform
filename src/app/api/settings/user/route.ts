import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    }

    const body = await req.json();
    // Qeyd: "wallpaper" sahəsi indi divar kağızı şəkli deyil, seçilmiş
    // Rəng Teması (Color Theme) id-sini saxlayır: default | blue | purple |
    // green | rose | orange | slate | zinc
    const { theme, language, wallpaper } = body;

    // İstifadəçinin şəxsi ayarlarını bazada yeniləyirik
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(theme && { theme }),
        ...(language && { language }),
        ...(wallpaper && { wallpaper }),
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("[USER_SETTINGS_PATCH]", error);
    return NextResponse.json({ error: "Server xətası baş verdi" }, { status: 500 });
  }
}