import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createLabelSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const labels = await prisma.label.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(labels);
  } catch (error) {
    console.error("[LABELS_GET]", error);
    return NextResponse.json(
      { error: "Internal Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "No company found" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = createLabelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const { name, color } = parsed.data;

    // Check for uniqueness
    const existing = await prisma.label.findFirst({
      where: { companyId, name: { equals: name, mode: "insensitive" } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Bu adla etiket artıq mövcuddur" },
        { status: 400 }
      );
    }

    const label = await prisma.label.create({
      data: {
        name,
        color,
        companyId,
      },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "CREATE",
      entityType: "LABEL",
      entityId: label.id,
      entityName: label.name,
    });

    return NextResponse.json(label);
  } catch (error) {
    console.error("[LABELS_POST]", error);
    return NextResponse.json(
      { error: "Internal Error" },
      { status: 500 }
    );
  }
}
