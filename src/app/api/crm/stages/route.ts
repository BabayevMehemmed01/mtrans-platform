import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Company Required" }, { status: 400 });

    let stages = await prisma.crmStage.findMany({
      where: { companyId },
      orderBy: { position: "asc" },
    });

    if (stages.length === 0) {
      const defaultStages = [
        { name: "Yeni Müraciət", color: "#3b82f6", position: 0 },
        { name: "Danışıqlar", color: "#f59e0b", position: 1 },
        { name: "Müqavilə Hazırlığı", color: "#8b5cf6", position: 2 },
        { name: "Qazanıldı", color: "#10b981", position: 3 },
        { name: "İtirilmiş", color: "#ef4444", position: 4 },
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
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Company Required" }, { status: 400 });

    const body = await req.json();
    const { name, color } = body;
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const maxPos = await prisma.crmStage.aggregate({ where: { companyId }, _max: { position: true } });

    const stage = await prisma.crmStage.create({
      data: {
        name,
        color: color || "#94a3b8",
        position: (maxPos._max.position ?? -1) + 1,
        companyId,
      },
    });

    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    console.error("[CRM_STAGES_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
