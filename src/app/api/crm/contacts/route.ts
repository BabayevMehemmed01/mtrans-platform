import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Company Required" }, { status: 400 });

    const contacts = await prisma.crmContact.findMany({
      where: { companyId },
      include: {
        crmCompany: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("[CRM_CONTACTS_GET]", error);
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
    const { firstName, lastName, email, phone, position, crmCompanyId } = body;

    if (!firstName) {
      return NextResponse.json({ error: "First name is required" }, { status: 400 });
    }

    if (crmCompanyId) {
      const crmCompany = await prisma.crmCompany.findFirst({ where: { id: crmCompanyId, companyId } });
      if (!crmCompany) return NextResponse.json({ error: "CRM company not found" }, { status: 404 });
    }

    const contact = await prisma.crmContact.create({
      data: {
        firstName,
        lastName: lastName || null,
        email: email || null,
        phone: phone || null,
        position: position || null,
        companyId,
        crmCompanyId: crmCompanyId || null,
      },
      include: {
        crmCompany: true,
      },
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error("[CRM_CONTACTS_POST]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
