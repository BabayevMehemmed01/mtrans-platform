import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTaskTemplateSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

// =============================================================================
// GET  /api/task-templates  — Şirkətin tapşırıq şablonları
// POST /api/task-templates  — Yeni şablon (Save as template)
// =============================================================================

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const companyId = (session.user as any).companyId as string | undefined;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { departmentId: true },
    });

    const templates = await prisma.taskTemplate.findMany({
      where: {
        companyId,
        OR: [
          { departmentId: null },
          ...(user?.departmentId ? [{ departmentId: user.departmentId }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("[GET /api/task-templates]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });

    const companyId = (session.user as any).companyId as string | undefined;
    if (!companyId) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });

    const body = await req.json();
    const parsed = createTaskTemplateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { departmentId: true },
    });

    let departmentId = parsed.data.departmentId || user?.departmentId || null;
    if (departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: departmentId, companyId },
        select: { id: true },
      });
      if (!dept) departmentId = null;
    }

    const template = await prisma.taskTemplate.create({
      data: {
        name: parsed.data.name.trim(),
        description: parsed.data.description || null,
        data: parsed.data.data ?? {},
        departmentId,
        companyId,
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
    console.error("[POST /api/task-templates]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
