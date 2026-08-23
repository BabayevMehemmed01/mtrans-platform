import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWhatsappMessage } from "@/lib/infobip";
import { formatPhoneForAPI } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "İcazə yoxdur" }, { status: 401 });
    const companyId = (session.user as any).companyId;
    if (!companyId) return NextResponse.json({ error: "Şirkət tələb olunur" }, { status: 400 });

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
    const { firstName, lastName, email, phone, position, crmCompanyId } = body;

    if (!firstName) {
      return NextResponse.json({ error: "Ad tələb olunur" }, { status: 400 });
    }

    if (crmCompanyId) {
      const crmCompany = await prisma.crmCompany.findFirst({ where: { id: crmCompanyId, companyId } });
      if (!crmCompany) return NextResponse.json({ error: "CRM şirkəti tapılmadı" }, { status: 404 });
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

    if (contact.phone) {
      const formattedPhone = formatPhoneForAPI(contact.phone);
      const customerName =
        [contact.firstName, contact.lastName].filter(Boolean).join(" ") || "Customer";
      void (async () => {
        try {
          await sendWhatsappMessage(formattedPhone, customerName, "test_whatsapp_template_en");
        } catch (error) {
          console.error("[WHATSAPP_CRM_TRIGGER_ERROR]", error);
        }
      })();
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("[CRM_CONTACTS_POST]", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}
