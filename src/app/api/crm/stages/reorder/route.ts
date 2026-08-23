import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reorderCrmStagesSchema } from "@/lib/validations";

// =============================================================================
// POST /api/crm/stages/reorder — Kanban sütunlarının (mərhələlərin) sırasını
// dəyişir. Body: { orderedIds: string[] } — bütün mərhələ ID-lərinin YENİ
// sırada tam siyahısı gözlənilir. `position` sahəsi massivdəki indeksə görə
// təyin olunur.
// =============================================================================

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tələb olunur" }, { status: 400 });

    const body = await req.json();
    const parsed = reorderCrmStagesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const { orderedIds } = parsed.data;

    const stages = await prisma.crmStage.findMany({ where: { companyId }, select: { id: true } });
    const validIds = new Set(stages.map((s) => s.id));
    if (orderedIds.length !== validIds.size || !orderedIds.every((id) => validIds.has(id))) {
      return NextResponse.json({ error: "Sıralama siyahısı şirkətin bütün mərhələlərini əhatə etməlidir" }, { status: 400 });
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.crmStage.update({ where: { id }, data: { position: index } })
      )
    );

    const updated = await prisma.crmStage.findMany({
      where: { companyId },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[CRM_STAGES_REORDER]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
