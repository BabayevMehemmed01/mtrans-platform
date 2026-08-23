import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTemplateSchema } from "@/lib/validations";
import { hasPermission, isSuperAdmin, PermissionError } from "@/lib/permissions";
import { ensureDefaultTemplates, getTemplateManagePermissions } from "@/lib/templates";
import { logAudit } from "@/lib/audit";
import type { TemplateType } from "@prisma/client";

const ALL_TYPES: TemplateType[] = ["PROJECT", "INVITATION", "ROLE"];

// =============================================================================
// GET  /api/templates?type=PROJECT|INVITATION|ROLE  — Şirkətin şablonları
// POST /api/templates                                — Yeni (xüsusi) şablon
// =============================================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    const typeParam = req.nextUrl.searchParams.get("type") as TemplateType | null;
    const types = typeParam && ALL_TYPES.includes(typeParam) ? [typeParam] : ALL_TYPES;

    // İlk dəfə açılanda hər tip üçün standart (isSystem) şablonlar avtomatik yaradılır.
    await Promise.all(types.map((type) => ensureDefaultTemplates(companyId, type)));

    const templates = await prisma.template.findMany({
      where: { companyId, type: { in: types } },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("[GET /api/templates]", error);
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
    const parsed = createTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const { type, name, description, data } = parsed.data;

    const perms = getTemplateManagePermissions(type);
    const allowed =
      (await isSuperAdmin(session.user.id)) || (await hasPermission(session.user.id, perms.create));
    if (!allowed) {
      throw new PermissionError("Bu tip şablon yaratmaq üçün icazəniz yoxdur");
    }

    const template = await prisma.template.create({
      data: {
        companyId,
        type,
        name: name.trim(),
        description: description || null,
        data: data ?? {},
        isSystem: false,
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
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "Bu adda şablon artıq mövcuddur" }, { status: 409 });
    }
    console.error("[POST /api/templates]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
