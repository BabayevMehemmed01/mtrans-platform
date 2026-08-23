import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCrmCompanySchema } from "@/lib/validations";

// =============================================================================
// PATCH  /api/crm/companies/[id] — CRM şirkətinin (B2B) məlumatlarını redaktə et
// DELETE /api/crm/companies/[id] — CRM şirkətini sil (bağlı əlaqə/əqdlər
//   `crmCompanyId = null` olaraq qalır — schema.prisma-da onDelete: SetNull)
// =============================================================================

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tələb olunur" }, { status: 400 });

    const { id } = await params;
    const existing = await prisma.crmCompany.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 404 });

    const body = await req.json();
    const parsed = updateCrmCompanySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const { name, industry, website, phone, email, address } = parsed.data;

    const crmCompany = await prisma.crmCompany.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(industry !== undefined && { industry: industry || null }),
        ...(website !== undefined && { website: website || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(email !== undefined && { email: email || null }),
        ...(address !== undefined && { address: address || null }),
      },
    });

    return NextResponse.json(crmCompany);
  } catch (error) {
    console.error("[CRM_COMPANY_PATCH]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tələb olunur" }, { status: 400 });

    const { id } = await params;
    const existing = await prisma.crmCompany.findFirst({ where: { id, companyId } });
    if (!existing) return NextResponse.json({ error: "Şirkət tapılmadı" }, { status: 404 });

    await prisma.crmCompany.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CRM_COMPANY_DELETE]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
