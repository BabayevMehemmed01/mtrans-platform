import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tələb olunur" }, { status: 400 });

    const { id } = await params;
    const body = await req.json();
    const { firstName, lastName, email, phone, position, crmCompanyId } = body;

    const existingContact = await prisma.crmContact.findFirst({ where: { id, companyId } });
    if (!existingContact) {
      return NextResponse.json({ error: "Əlaqə tapılmadı" }, { status: 404 });
    }

    if (crmCompanyId) {
      const crmCompany = await prisma.crmCompany.findFirst({ where: { id: crmCompanyId, companyId } });
      if (!crmCompany) return NextResponse.json({ error: "CRM şirkəti tapılmadı" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName || null;
    if (email !== undefined) data.email = email || null;
    if (phone !== undefined) data.phone = phone || null;
    if (position !== undefined) data.position = position || null;
    if (crmCompanyId !== undefined) data.crmCompanyId = crmCompanyId || null;

    const contact = await prisma.crmContact.update({
      where: { id },
      data,
      include: {
        crmCompany: true,
      },
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error("[CRM_CONTACTS_PATCH]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tələb olunur" }, { status: 400 });

    const { id } = await params;

    const existingContact = await prisma.crmContact.findFirst({ where: { id, companyId } });
    if (!existingContact) {
      return NextResponse.json({ error: "Əlaqə tapılmadı" }, { status: 404 });
    }

    await prisma.crmContact.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CRM_CONTACTS_DELETE]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
