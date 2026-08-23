import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createMarketingTemplateSchema, campaignTypeEnum } from "@/lib/validations";
import { logAudit } from "@/lib/audit";
import { ensureDefaultMarketingTemplates } from "@/lib/templates";

// =============================================================================
// GET  /api/marketing/templates — Şirkətin kampaniya şablonları (?type= filteri).
//   İlk çağırışda həmin kanal üçün heç bir şablon yoxdursa, standart (isSystem)
//   nümunələr avtomatik yaradılır (CRM Stages-dəki lazy-seed nümunəsi).
// POST /api/marketing/templates — Yeni (istifadəçi) şablonu yarat.
// =============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const parsedType = campaignTypeEnum.safeParse(searchParams.get("type"));

    if (parsedType.success) {
      await ensureDefaultMarketingTemplates(companyId, parsedType.data);
    } else {
      await Promise.all(
        campaignTypeEnum.options.map((type) => ensureDefaultMarketingTemplates(companyId, type))
      );
    }

    const templates = await prisma.marketingTemplate.findMany({
      where: {
        companyId,
        ...(parsedType.success ? { type: parsedType.data } : {}),
      },
      orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("[GET /api/marketing/templates]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    const body = await req.json();
    const parsed = createMarketingTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const template = await prisma.marketingTemplate.create({
      data: {
        name: data.name.trim(),
        type: data.type,
        subject: data.subject || null,
        content: data.content || "",
        companyId,
        createdById: session.user.id,
      },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "CREATE",
      entityType: "TEMPLATE",
      entityId: template.id,
      entityName: template.name,
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error("[POST /api/marketing/templates]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
