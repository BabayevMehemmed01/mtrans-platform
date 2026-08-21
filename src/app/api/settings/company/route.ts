import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCompanySchema } from "@/lib/validations";
import { requirePermission, PermissionError } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    }

    const companyId = (session.user as any).companyId;
    if (!companyId) {
      return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 400 });
    }

    await requirePermission(session.user.id, "CAN_MANAGE_COMPANY");

    const body = await req.json();
    const parsed = updateCompanySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const data = parsed.data as any; // ts xətasının qarşısını almaq üçün

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.logo !== undefined && { logo: data.logo }),
        ...(data.taxId !== undefined && { taxId: data.taxId }), // YENİ: VÖEN əlavə edildi
      },
    });

    await logAudit({
      userId: session.user.id,
      companyId,
      action: "UPDATE",
      entityType: "COMPANY",
      entityId: companyId,
      entityName: updated.name,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof PermissionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[COMPANY_PATCH]", error);
    return NextResponse.json(
      { error: "Server xətası" },
      { status: 500 }
    );
  }
}