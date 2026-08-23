import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCrmStageSchema } from "@/lib/validations";

// =============================================================================
// PATCH  /api/crm/stages/[id] — Mərhələnin adını/rəngini redaktə et
// DELETE /api/crm/stages/[id]?reassignToStageId=... — Mərhələni sil
//   Əgər mərhələdə əqdlər varsa və `reassignToStageId` göndərilməyibsə,
//   409 statusu ilə əqd sayını qaytarır ki, UI istifadəçidən köçürmə
//   mərhələsi seçməsini xahiş etsin. Ən son (tək qalan) mərhələ silinə bilməz.
// =============================================================================

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tələb olunur" }, { status: 400 });

    const { id } = await params;
    const existing = await prisma.crmStage.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Mərhələ tapılmadı" }, { status: 404 });

    const body = await req.json();
    const parsed = updateCrmStageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const { name, color } = parsed.data;

    const stage = await prisma.crmStage.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(color !== undefined && { color }),
      },
    });

    return NextResponse.json(stage);
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Bu adda mərhələ artıq mövcuddur" }, { status: 409 });
    }
    console.error("[CRM_STAGE_PATCH]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tələb olunur" }, { status: 400 });

    const { id } = await params;
    const existing = await prisma.crmStage.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Mərhələ tapılmadı" }, { status: 404 });

    const totalStages = await prisma.crmStage.count({ where: { companyId } });
    if (totalStages <= 1) {
      return NextResponse.json(
        { error: "Sonuncu mərhələ silinə bilməz — ən azı bir mərhələ qalmalıdır" },
        { status: 409 }
      );
    }

    const dealCount = await prisma.crmDeal.count({ where: { stageId: id } });
    const reassignToStageId = req.nextUrl.searchParams.get("reassignToStageId");

    if (dealCount > 0) {
      if (!reassignToStageId) {
        return NextResponse.json(
          {
            error: `Bu mərhələdə ${dealCount} əqd var. Silmək üçün əvvəlcə əqdləri başqa mərhələyə köçürün.`,
            dealCount,
          },
          { status: 409 }
        );
      }
      const targetStage = await prisma.crmStage.findFirst({
        where: { id: reassignToStageId, companyId },
      });
      if (!targetStage) {
        return NextResponse.json({ error: "Köçürüləcək mərhələ tapılmadı" }, { status: 404 });
      }
      await prisma.crmDeal.updateMany({
        where: { stageId: id },
        data: { stageId: reassignToStageId },
      });
    }

    await prisma.crmStage.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CRM_STAGE_DELETE]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
