import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateLabelSchema } from "@/lib/validations";
import { logAudit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    const body = await req.json();
    const parsed = updateLabelSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const { name, color } = parsed.data;

    const { id } = await params;

    // Check if label exists and belongs to company
    const existing = await prisma.label.findUnique({
      where: { id },
    });

    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check for name conflict
    if (name !== undefined) {
      const conflict = await prisma.label.findFirst({
        where: {
          companyId,
          name: { equals: name, mode: "insensitive" },
          id: { not: id },
        },
      });

      if (conflict) {
        return NextResponse.json(
          { error: "Bu adla etiket artıq mövcuddur" },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.label.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
      },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "UPDATE",
      entityType: "LABEL",
      entityId: updated.id,
      entityName: updated.name,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[LABEL_PATCH]", error);
    return NextResponse.json(
      { error: "Internal Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;

    const { id } = await params;

    const existing = await prisma.label.findUnique({
      where: { id },
    });

    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.label.delete({
      where: { id },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "DELETE",
      entityType: "LABEL",
      entityId: existing.id,
      entityName: existing.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LABEL_DELETE]", error);
    return NextResponse.json(
      { error: "Internal Error" },
      { status: 500 }
    );
  }
}
