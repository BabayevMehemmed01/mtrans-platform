import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCrmStageSchema } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tələb olunur" }, { status: 400 });

    let stages = await prisma.crmStage.findMany({
      where: { companyId },
      orderBy: { position: "asc" },
    });

    if (stages.length === 0) {
      const defaultStages = [
        { name: "Yeni Müraciət", color: "#2FC6F6", position: 0 },
        { name: "Danışıqlar", color: "#55D0E0", position: 1 },
        { name: "Müqavilə Hazırlığı", color: "#8284F8", position: 2 },
        { name: "Qazanıldı", color: "#F7A700", position: 3 },
        { name: "İtirilmiş", color: "#A8ADB4", position: 4 },
      ];

      await prisma.crmStage.createMany({
        data: defaultStages.map((stage) => ({ ...stage, companyId })),
      });

      stages = await prisma.crmStage.findMany({
        where: { companyId },
        orderBy: { position: "asc" },
      });
    }

    return NextResponse.json(stages);
  } catch (error) {
    console.error("[CRM_STAGES_GET]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tələb olunur" }, { status: 400 });

    const body = await req.json();
    const parsed = createCrmStageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const { name, color } = parsed.data;

    const maxPos = await prisma.crmStage.aggregate({ where: { companyId }, _max: { position: true } });

    const stage = await prisma.crmStage.create({
      data: {
        name: name.trim(),
        color: color || "#94a3b8",
        position: (maxPos._max.position ?? -1) + 1,
        companyId,
      },
    });

    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Bu adda mərhələ artıq mövcuddur" }, { status: 409 });
    }
    console.error("[CRM_STAGES_POST]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
