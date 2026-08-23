import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCrmCompanySchema } from "@/lib/validations";

// =============================================================================
// CRM Companies (B2B) — deal/contact formlarında "Əlaqədar Şirkət" seçimi üçün.
// Eyni auth/scoping nümunəsi digər /api/crm/** route-larından götürülüb.
// =============================================================================

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tələb olunur" }, { status: 400 });

    const companies = await prisma.crmCompany.findMany({
      where: { companyId },
      include: {
        _count: { select: { contacts: true, deals: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("[CRM_COMPANIES_GET]", error);
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
    const parsed = createCrmCompanySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Məlumatlar düzgün deyil" },
        { status: 400 }
      );
    }
    const { name, industry, website, phone, email, address } = parsed.data;

    const crmCompany = await prisma.crmCompany.create({
      data: {
        name,
        industry: industry || null,
        website: website || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        companyId,
      },
    });

    return NextResponse.json(crmCompany, { status: 201 });
  } catch (error) {
    console.error("[CRM_COMPANIES_POST]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
